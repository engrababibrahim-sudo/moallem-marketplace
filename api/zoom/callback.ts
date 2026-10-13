import { createClient } from "@supabase/supabase-js";
import { jwtVerify } from "jose";
import { createCipheriv, randomBytes } from "node:crypto";
type ZoomToken={access_token?:string;refresh_token?:string;expires_in?:number;scope?:string};
function encrypt(value:string,key:Buffer){const iv=randomBytes(12);const cipher=createCipheriv("aes-256-gcm",key,iv);const data=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);return [iv.toString("base64url"),cipher.getAuthTag().toString("base64url"),data.toString("base64url")].join(".");}
function html(res:any,status:number,title:string,body:string){res.setHeader("Content-Type","text/html; charset=utf-8");res.setHeader("Cache-Control","no-store");return res.status(status).send("<!doctype html><html lang=\"ar\" dir=\"rtl\"><meta charset=\"utf-8\"><title>"+title+"</title><body style=\"font-family:Arial;padding:32px\"><h2>"+title+"</h2><p>"+body+"</p><a href=\"/\">العودة إلى منصة مُعلّم</a></body></html>");}
export default async function handler(req:any,res:any){
 if(req.method!=="GET"){res.setHeader("Allow","GET");return html(res,405,"طلب غير مدعوم","");}
 const code=String(req.query?.code||"");const state=String(req.query?.state||"");const zoomError=String(req.query?.error||"");
 if(zoomError)return html(res,400,"لم يكتمل ربط Zoom","لم تتم الموافقة على ربط الحساب.");
 const clientId=process.env.ZOOM_OAUTH_CLIENT_ID||process.env.ZOOM_CLIENT_ID;const secret=process.env.ZOOM_OAUTH_CLIENT_SECRET||process.env.ZOOM_CLIENT_SECRET;const stateSecret=process.env.ZOOM_OAUTH_STATE_SECRET;const encryptionSecret=process.env.ZOOM_TOKEN_ENCRYPTION_KEY;const redirectUri=process.env.ZOOM_OAUTH_REDIRECT_URI||"https://moallem-marketplace-nine.vercel.app/api/zoom/callback";const url=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL;const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!code||!state||!clientId||!secret||!stateSecret||!encryptionSecret||!url||!serviceKey)return html(res,503,"إعدادات غير مكتملة","تعذر إكمال الربط لأن إعدادات الخادم غير مكتملة.");
 try{
  const {payload}=await jwtVerify(state,new TextEncoder().encode(stateSecret));
  if(payload.purpose!=="teacher-zoom-connect"||typeof payload.sub!=="string")return html(res,400,"رابط غير صالح","أعيدي بدء ربط Zoom من حساب المعلم.");
  const key=Buffer.from(encryptionSecret,"base64");if(key.length!==32)return html(res,503,"إعداد التشفير غير صحيح","يجب ضبط ZOOM_TOKEN_ENCRYPTION_KEY كمفتاح Base64 بطول 32 بايت.");
  const basic=Buffer.from(clientId+":"+secret).toString("base64");const form=new URLSearchParams({grant_type:"authorization_code",code,redirect_uri:redirectUri});
  const tokenResponse=await fetch("https://zoom.us/oauth/token",{method:"POST",headers:{Authorization:"Basic "+basic,"Content-Type":"application/x-www-form-urlencoded"},body:form});
  const tokens=await tokenResponse.json().catch(()=>null) as ZoomToken|null;
  if(!tokenResponse.ok||!tokens?.access_token||!tokens.refresh_token) {console.error("Zoom token exchange failed",tokenResponse.status);return html(res,502,"فشل التفويض","رفض Zoom إكمال التفويض. راجعي Redirect URL والصلاحيات.");}
  const meResponse=await fetch("https://api.zoom.us/v2/users/me",{headers:{Authorization:"Bearer "+tokens.access_token}});
  const me=await meResponse.json().catch(()=>null) as {id?:string;email?:string}|null;
  if(!meResponse.ok||!me?.id||!me.email)return html(res,502,"تعذر قراءة حساب Zoom","لم نتمكن من التحقق من حساب Zoom.");
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const now=new Date();const expiresAt=new Date(now.getTime()+Math.max(60,tokens.expires_in||3600)*1000).toISOString();
  const {error}=await admin.from("teacher_zoom_connections").upsert({teacher_id:payload.sub,zoom_user_id:me.id,zoom_email:me.email.toLowerCase(),access_token_encrypted:encrypt(tokens.access_token,key),refresh_token_encrypted:encrypt(tokens.refresh_token,key),access_token_expires_at:expiresAt,scopes:tokens.scope||null,connected_at:now.toISOString(),updated_at:now.toISOString()},{onConflict:"teacher_id"});
  if(error){console.error("Saving Zoom connection failed",error.message);return html(res,500,"تعذر حفظ الربط","لم يتم حفظ الاتصال. تأكدي من تشغيل ترحيل قاعدة البيانات.");}
  return html(res,200,"تم ربط Zoom","تم التحقق من حساب Zoom وحفظ الاتصال بشكل مشفر. يلزم استكمال تفعيل استخدام الاتصال في إنشاء الحصص.");
 }catch(e){console.error("Zoom OAuth callback failed",e);return html(res,400,"تعذر التحقق من الطلب","انتهت صلاحية رابط الربط أو أنه غير صالح. ابدئي الربط مرة أخرى.");}
}
