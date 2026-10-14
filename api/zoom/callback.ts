import { createClient } from "@supabase/supabase-js";
import { verifyState } from "./_oauth.js";
import { createCipheriv, randomBytes } from "node:crypto";

type ZoomTokenResponse={access_token?:string;refresh_token?:string;expires_in?:number;scope?:string;error?:string};
type ZoomUser={id?:string;email?:string};
function html(res:any,status:number,title:string,message:string){res.setHeader("Content-Type","text/html; charset=utf-8");res.setHeader("Cache-Control","no-store");return res.status(status).send("<!doctype html><html lang='ar' dir='rtl'><meta charset='utf-8'><meta name='viewport' content='width=device-width'><title>"+title+"</title><main style='font-family:Arial;max-width:620px;margin:48px auto;padding:24px'><h2>"+title+"</h2><p>"+message+"</p><a href='https://moallem-marketplace-nine.vercel.app/'>العودة إلى منصة مُعلّم</a></main></html>");}
function encrypt(value:string,keyText:string){const key=Buffer.from(keyText,"base64");if(key.length!==32)throw new Error("ZOOM_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key");const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",key,iv);const body=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return [iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),body.toString("base64url")].join(".");}
export default async function handler(req:any,res:any){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return html(res,405,"طلب غير مدعوم","أعيدي المحاولة من منصة مُعلّم.");}
 const code=String(req.query?.code||"");const state=String(req.query?.state||"");const oauthError=String(req.query?.error||"");
 if(oauthError)return html(res,400,"لم يتم ربط Zoom","تم إلغاء الموافقة أو رفضها داخل Zoom.");
 const clientId=process.env.ZOOM_OAUTH_CLIENT_ID;const secret=process.env.ZOOM_OAUTH_CLIENT_SECRET;const redirect=process.env.ZOOM_OAUTH_REDIRECT_URI;const encryptionKey=process.env.ZOOM_TOKEN_ENCRYPTION_KEY;
 const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;const service=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const missingEnv=[["ZOOM_OAUTH_CLIENT_ID",clientId],["ZOOM_OAUTH_CLIENT_SECRET",secret],["ZOOM_OAUTH_REDIRECT_URI",redirect],["ZOOM_TOKEN_ENCRYPTION_KEY",encryptionKey],["SUPABASE_URL or VITE_SUPABASE_URL",url],["SUPABASE_SERVICE_ROLE_KEY",service]].filter(([,value])=>!value).map(([name])=>name);
 if(!code||!state||missingEnv.length){
  console.error("Zoom OAuth callback missing inputs",{missingEnv,hasCode:Boolean(code),hasState:Boolean(state),hasOAuthError:Boolean(oauthError)});
  const issues=[...missingEnv,...(!code?["Zoom authorization code was not received"]:[]),...(!state?["OAuth state was not received"]:[])];
  return html(res,503,"تعذر إكمال ربط Zoom","السبب المحدد: "+issues.join("، ")+". لم يتم عرض أي مفاتيح سرية. راجعي إعدادات التطبيق ثم أعيدي المحاولة.");
 }
 try{
  const stateParts=state.split(".");
  if(stateParts.length!==2 || !verifyState(stateParts[0],stateParts[1])) throw new Error("Invalid OAuth state signature");
  const statePayload=JSON.parse(Buffer.from(stateParts[0],"base64url").toString("utf8")) as {uid?:string;exp?:number;nonce?:string};
  const teacherId=String(statePayload.uid||"");
  if(!teacherId || !Number.isFinite(statePayload.exp) || Number(statePayload.exp)<Date.now() || !statePayload.nonce) throw new Error("Expired or invalid OAuth state");
  const tokenResponse=await fetch("https://zoom.us/oauth/token",{method:"POST",headers:{Authorization:"Basic "+Buffer.from(clientId+":"+secret).toString("base64"),"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({grant_type:"authorization_code",code,redirect_uri:redirect})});
  const token=await tokenResponse.json().catch(()=>null) as ZoomTokenResponse|null;
  if(!tokenResponse.ok||!token?.access_token)throw new Error("Zoom token exchange failed");
  const meResponse=await fetch("https://api.zoom.us/v2/users/me",{headers:{Authorization:"Bearer "+token.access_token}});
  const me=await meResponse.json().catch(()=>null) as ZoomUser|null;
  if(!meResponse.ok||!me?.id||!me.email)throw new Error("Could not verify Zoom user");
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await admin.from("teacher_zoom_connections").upsert({teacher_id:teacherId,zoom_user_id:me.id,zoom_email:me.email.toLowerCase(),connected_at:new Date().toISOString(),access_token_encrypted:encrypt(token.access_token,encryptionKey),refresh_token_encrypted:token.refresh_token?encrypt(token.refresh_token,encryptionKey):null,token_expires_at:new Date(Date.now()+Math.max(60,Number(token.expires_in||3600))*1000).toISOString(),scopes:String(token.scope||"").split(/[ ,]+/).filter(Boolean),updated_at:new Date().toISOString()},{onConflict:"teacher_id"});
  if(error)throw new Error("Could not save Zoom connection");
  return html(res,200,"تم ربط Zoom بنجاح","تم ربط حساب Zoom ("+me.email.replace(/[<>&"]/g,"")+") بحساب المعلم. يمكنك العودة إلى منصة مُعلّم.");
 }catch(error){console.error("Zoom OAuth callback failed",error);return html(res,400,"تعذر ربط Zoom","لم نتمكن من إكمال الربط. تأكدي من إعدادات التطبيق والصلاحيات ثم حاولي مرة أخرى.");}
}
