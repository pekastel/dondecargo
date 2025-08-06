import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones - DondeCargo',
  description: 'Términos y condiciones de uso de la plataforma DondeCargo',
};

export default function TycLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
