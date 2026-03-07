import AdminPopupForm from '../_components/admin-popup-form';

export default async function PopupEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminPopupForm id={id} />;
}
