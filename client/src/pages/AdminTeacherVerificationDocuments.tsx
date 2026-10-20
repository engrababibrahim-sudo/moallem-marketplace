import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileText,
  Video,
  Image as ImageIcon,
  ExternalLink,
} from "lucide-react";

type DocumentType = "qualification" | "identity" | "teaching_video";
type DocumentStatus = "pending" | "approved" | "rejected";

type VerificationDocument = {
  id: string;
  teacher_id: string;
  document_type: DocumentType;
  storage_path: string;
  status: DocumentStatus;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

type DocumentItem = {
  type: DocumentType;
  title: string;
  description: string;
  icon: typeof FileText;
};

const REQUIRED_DOCUMENTS: DocumentItem[] = [
  {
    type: "qualification",
    title: "شهادة المؤهل الدراسي",
    description: "ملف PDF أو صورة JPG/PNG",
    icon: FileText,
  },
  {
    type: "identity",
    title: "إثبات الهوية",
    description: "ملف PDF أو صورة JPG/PNG",
    icon: ImageIcon,
  },
  {
    type: "teaching_video",
    title: "فيديو الشرح",
    description: "فيديو MP4 أو WebM",
    icon: Video,
  },
];

const statusLabels: Record<DocumentStatus, string> = {
  pending: "بانتظار المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

const statusClasses: Record<DocumentStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

export default function AdminTeacherVerificationDocuments({
  teacherId,
}: {
  teacherId: string;
}) {
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError("");
    setNotice("");

    const { data, error: loadError } = await supabase
      .from("teacher_verification_documents")
      .select(
        "id,teacher_id,document_type,storage_path,status,review_note,reviewed_by,reviewed_at,created_at"
      )
      .eq("teacher_id", teacherId);

    if (loadError) {
      setError(
        "تعذر تحميل مستندات المعلم. تحققي من إنشاء الجدول وصلاحيات الإدارة. التفاصيل: " +
          loadError.message
      );
      setLoading(false);
      return;
    }

    const rows = (data ?? []) as VerificationDocument[];
    setDocuments(rows);

    const urlEntries = await Promise.all(
      rows.map(async (document) => {
        const { data: urlData, error: urlError } = await supabase.storage
          .from("teacher-verification")
          .createSignedUrl(document.storage_path, 300);

        if (urlError || !urlData?.signedUrl) {
          return [document.id, ""] as const;
        }

        return [document.id, urlData.signedUrl] as const;
      })
    );

    setSignedUrls(Object.fromEntries(urlEntries));
    setNotes(
      Object.fromEntries(
        rows.map((document) => [
          document.id,
          document.review_note ?? "",
        ])
      )
    );

    setLoading(false);
  }, [teacherId]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  async function reviewDocument(
    document: VerificationDocument,
    status: "approved" | "rejected"
  ) {
    if (savingId) return;

    const note = (notes[document.id] ?? "").trim();

    if (status === "rejected" && !note) {
      setError("اكتبي سبب رفض المستند قبل تسجيل القرار.");
      return;
    }

    setSavingId(document.id);
    setError("");
    setNotice("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        setError("انتهت جلسة الإدارة أو تعذر التحقق من المستخدم.");
        return;
      }

      const { data, error: updateError } = await supabase
        .from("teacher_verification_documents")
        .update({
          status,
          review_note: note || null,
          reviewed_by: authData.user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", document.id)
        .eq("teacher_id", teacherId)
        .select(
          "id,teacher_id,document_type,storage_path,status,review_note,reviewed_by,reviewed_at,created_at"
        )
        .maybeSingle();

      if (updateError) {
        setError(
          "تعذر حفظ قرار المستند. تحققي من صلاحيات الإدارة في Supabase. التفاصيل: " +
            updateError.message
        );
        return;
      }

      if (!data) {
        setError(
          "لم يتم تحديث المستند. قد تمنع سياسات الصلاحيات هذا الإجراء."
        );
        return;
      }

      setDocuments((current) =>
        current.map((item) =>
          item.id === document.id
            ? (data as VerificationDocument)
            : item
        )
      );

      setNotice(
        status === "approved"
          ? "تم قبول المستند."
          : "تم رفض المستند وتسجيل السبب."
      );
    } catch (unexpectedError) {
      setError(
        unexpectedError instanceof Error
          ? unexpectedError.message
          : "حدث خطأ غير متوقع أثناء مراجعة المستند."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section className="rounded-2xl border bg-white p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">مستندات اعتماد المعلم</h3>
          <p className="mt-1 text-sm text-slate-500">
            راجعي كل ملف على حدة قبل اعتماد المعلم.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadDocuments()}
          disabled={loading || savingId !== null}
          className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={15} />
          تحديث المستندات
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-800"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}

      {loading ? (
        <p className="py-6 text-center text-sm text-slate-500">
          جارٍ تحميل المستندات...
        </p>
      ) : (
        <div className="space-y-4">
          {REQUIRED_DOCUMENTS.map((item) => {
            const Icon = item.icon;
            const document = documents.find(
              (row) => row.document_type === item.type
            );

            if (!document) {
              return (
                <div
                  key={item.type}
                  className="rounded-xl border border-dashed p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-600">
                      <Icon size={21} />
                    </div>
                    <div>
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.description}
                      </p>
                      <span className="mt-2 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                        لم يُرفع بعد
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            const fileUrl = signedUrls[document.id];
            const isSaving = savingId === document.id;

            return (
              <div
                key={item.type}
                className="rounded-xl border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
                      <Icon size={21} />
                    </div>
                    <div>
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="mt-1 text-xs text-slate-500">
                        تاريخ الرفع:{" "}
                        {new Date(document.created_at).toLocaleString("ar-EG")}
                      </p>
                      <span
                        className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[document.status]}`}
                      >
                        {statusLabels[document.status]}
                      </span>
                    </div>
                  </div>

                  {fileUrl ? (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                    >
                      <ExternalLink size={15} />
                      فتح الملف
                    </a>
                  ) : (
                    <span className="text-xs text-amber-700">
                      تعذر إنشاء رابط الملف؛ حدّثي المستندات.
                    </span>
                  )}
                </div>

                {document.document_type === "teaching_video" &&
                  fileUrl && (
                    <video
                      controls
                      preload="metadata"
                      className="mt-4 max-h-72 w-full rounded-xl bg-black"
                    >
                      <source src={fileUrl} />
                      المتصفح لا يدعم تشغيل هذا الفيديو.
                    </video>
                  )}

                <label className="mt-4 block text-sm font-semibold">
                  ملاحظات المراجعة
                  <textarea
                    value={notes[document.id] ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [document.id]: event.target.value,
                      }))
                    }
                    rows={2}
                    disabled={isSaving}
                    placeholder="اكتبي الملاحظات أو سبب الرفض..."
                    className="mt-2 w-full rounded-xl border p-3 font-normal outline-none focus:border-blue-500 disabled:opacity-50"
                  />
                </label>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      void reviewDocument(document, "approved")
                    }
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    قبول المستند
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      void reviewDocument(document, "rejected")
                    }
                    className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    رفض المستند
                  </button>

                  {isSaving && (
                    <span className="self-center text-xs text-slate-500">
                      جارٍ حفظ القرار...
                    </span>
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
