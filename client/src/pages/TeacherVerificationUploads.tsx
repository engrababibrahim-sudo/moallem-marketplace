
import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  Video,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

type DocumentType = "qualification" | "identity" | "teaching_video";

type VerificationDocument = {
  id: string;
  document_type: DocumentType;
  storage_path: string;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
};

const DOCUMENTS: {
  type: DocumentType;
  title: string;
  description: string;
  accept: string;
  icon: typeof FileText;
}[] = [
  {
    type: "qualification",
    title: "شهادة المؤهل الدراسي",
    description: "ارفعي شهادة المؤهل بصيغة PDF أو صورة.",
    accept: ".pdf,image/jpeg,image/png",
    icon: FileText,
  },
  {
    type: "identity",
    title: "إثبات الهوية",
    description: "ارفعي صورة الهوية أو جواز السفر بصيغة PDF أو صورة.",
    accept: ".pdf,image/jpeg,image/png",
    icon: FileText,
  },
  {
    type: "teaching_video",
    title: "فيديو شرح",
    description:
      "ارفعي فيديو قصير يوضح أسلوبك في التدريس. الحد الأقصى 100 ميجابايت.",
    accept: "video/mp4,video/webm",
    icon: Video,
  },
];

const MAX_FILE_SIZE = 100 * 1024 * 1024;

export default function TeacherVerificationUploads() {
  const { user } = useAuth();

  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<DocumentType | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("teacher_verification_documents")
      .select("id,document_type,storage_path,status,review_note")
      .eq("teacher_id", user.id);

    if (queryError) {
      setError("تعذر تحميل حالة المستندات: " + queryError.message);
      setLoading(false);
      return;
    }

    setDocuments((data ?? []) as VerificationDocument[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const uploadDocument = async (type: DocumentType, file?: File) => {
    if (!user || !file) return;

    setError("");
    setMessage("");

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      setError(
        "حجم الملف يجب أن يكون أكبر من صفر وألا يتجاوز 100 ميجابايت."
      );
      return;
    }

    const isVideo = type === "teaching_video";

    const allowedTypes = isVideo
      ? ["video/mp4", "video/webm"]
      : ["application/pdf", "image/jpeg", "image/png"];

    if (!allowedTypes.includes(file.type)) {
      setError(
        isVideo
          ? "صيغة الفيديو غير مدعومة. استخدمي MP4 أو WebM."
          : "صيغة الملف غير مدعومة. استخدمي PDF أو JPG أو PNG."
      );
      return;
    }

    const existing = documents.find(
      (doc) => doc.document_type === type
    );

    if (existing && existing.status !== "rejected") {
      setError(
        "هذا المستند موجود بالفعل. لا يمكن استبداله إلا بعد رفضه من الإدارة."
      );
      return;
    }

    setUploading(type);

    let uploadedPath: string | null = null;

    try {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "bin";

      const path =
        `${user.id}/${type}-${crypto.randomUUID()}.${extension}`;

      // رفع الشهادات والهوية وفيديو التقديم إلى Supabase Storage.
      // Google Drive مخصص لتسجيلات الحصص بعد انتهائها.
      const { error: storageError } = await supabase.storage
        .from("teacher-verification")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });

      if (storageError) {
        throw new Error(
          "تعذر رفع الملف إلى Supabase: " + storageError.message
        );
      }

      uploadedPath = path;

      if (existing) {
        const { data: updated, error: updateError } = await supabase
          .from("teacher_verification_documents")
          .update({
            storage_path: path,
            status: "pending",
            review_note: null,
            reviewed_by: null,
            reviewed_at: null,
          })
          .eq("id", existing.id)
          .eq("teacher_id", user.id)
          .eq("status", "rejected")
          .select("id")
          .maybeSingle();

        if (updateError) {
          throw new Error(
            "تم رفع الملف لكن تعذر تسجيل الاستبدال: " +
              updateError.message
          );
        }

        if (!updated) {
          throw new Error(
            "لم يتم استبدال المستند. ربما تغيرت حالته. حدّثي الصفحة وحاولي مجددًا."
          );
        }

        const { error: removeOldError } = await supabase.storage
          .from("teacher-verification")
          .remove([existing.storage_path]);

        if (removeOldError) {
          console.warn(
            "تعذر حذف النسخة القديمة:",
            removeOldError
          );
        }
      } else {
        const { error: insertError } = await supabase
          .from("teacher_verification_documents")
          .insert({
            teacher_id: user.id,
            document_type: type,
            storage_path: path,
            status: "pending",
          });

        if (insertError) {
          throw new Error(
            "تم رفع الملف لكن تعذر تسجيله في جدول المستندات: " +
              insertError.message
          );
        }
      }

      // الملف أصبح مسجلاً في قاعدة البيانات، فلا نحذفه عند الخروج.
      uploadedPath = null;

      setMessage(
        isVideo
          ? "تم رفع فيديو الشرح إلى Supabase وتسجيله للمراجعة."
          : "تم رفع المستند وتسجيله بنجاح."
      );

      await loadDocuments();
    } catch (err) {
      // تنظيف الملف الجديد إذا فشلت عملية تسجيله.
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage
          .from("teacher-verification")
          .remove([uploadedPath]);

        if (cleanupError) {
          console.warn(
            "تعذر حذف الملف بعد فشل التسجيل:",
            cleanupError
          );
        }
      }

      setError(
        err instanceof Error
          ? err.message
          : "حدث خطأ غير متوقع أثناء رفع المستند."
      );
    } finally {
      setUploading(null);
    }
  };

  if (!user) return null;

  return (
    <section className="mt-6 rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-extrabold">
        مستندات اعتماد المعلم
      </h2>

      <p className="mt-2 text-sm leading-7 text-black/60">
        ارفعي المستندات الثلاثة المطلوبة. لن تكون الملفات متاحة للعامة،
        وستتمكن الإدارة المخوّلة من مراجعتها.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700"
        >
          {message}
        </div>
      )}

      {loading ? (
        <p className="mt-5 text-sm text-black/60">
          جارٍ تحميل حالة المستندات...
        </p>
      ) : (
        <div className="mt-5 grid gap-4">
          {DOCUMENTS.map((item) => {
            const Icon = item.icon;

            const doc = documents.find(
              (entry) => entry.document_type === item.type
            );

            const busy = uploading === item.type;

            return (
              <div
                key={item.type}
                className="rounded-2xl border border-black/10 p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-orange-50 text-[#ff7a00]">
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold">{item.title}</h3>

                    <p className="mt-1 text-sm leading-6 text-black/60">
                      {item.description}
                    </p>

                    <p className="mt-2 text-sm font-bold">
                      {!doc
                        ? "لم يُرفع بعد"
                        : doc.status === "approved"
                          ? "تمت الموافقة على المستند"
                          : doc.status === "rejected"
                            ? "مرفوض — يمكنك رفع نسخة جديدة"
                            : "قيد المراجعة"}
                    </p>

                    {doc?.status === "rejected" &&
                      doc.review_note && (
                        <p className="mt-2 text-sm text-red-700">
                          ملاحظة الإدارة: {doc.review_note}
                        </p>
                      )}

                    {!doc || doc.status === "rejected" ? (
                      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#182431] px-4 py-2.5 text-sm font-bold text-white">
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}

                        {busy
                          ? "جارٍ الرفع..."
                          : doc
                            ? "رفع نسخة جديدة"
                            : "اختيار ملف"}

                        <input
                          type="file"
                          accept={item.accept}
                          className="hidden"
                          disabled={uploading !== null}
                          onChange={(event) => {
                            const selectedFile =
                              event.target.files?.[0];

                            event.target.value = "";

                            if (selectedFile) {
                              void uploadDocument(
                                item.type,
                                selectedFile
                              );
                            }
                          }}
                        />
                      </label>
                    ) : null}
                  </div>

                  {doc?.status === "approved" && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
