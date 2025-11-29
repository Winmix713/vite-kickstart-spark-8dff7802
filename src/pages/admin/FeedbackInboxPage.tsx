import AdminLayout from "@/components/admin/AdminLayout";
import FeedbackInboxPanel from "@/components/admin/feedback/FeedbackInboxPanel";

const FeedbackInboxPage = () => {
  return (
    <AdminLayout
      title="Feedback Inbox"
      description="Review and manage user feedback and suggestions for predictions"
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Feedback Inbox" },
      ]}
    >
      <FeedbackInboxPanel />
    </AdminLayout>
  );
};

export default FeedbackInboxPage;