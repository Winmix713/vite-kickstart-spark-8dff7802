import AdminLayout from "@/components/admin/AdminLayout";
import FeedbackInboxPanel from "@/components/admin/feedback/FeedbackInboxPanel";
const FeedbackInboxPage = () => {
  return <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback Inbox</h1>
          <p className="text-muted-foreground">
            Review and manage user feedback and suggestions for predictions
          </p>
        </div>
        <FeedbackInboxPanel />
      </div>
    </AdminLayout>;
};
export default FeedbackInboxPage;