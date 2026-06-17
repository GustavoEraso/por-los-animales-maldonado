import type { Metadata } from 'next';
import LogsClient from './LogsClient';

export const metadata: Metadata = {
  title: 'Auditoría',
  description: 'Visualización de logs del sistema',
};

export default function LogsPage() {
  return <LogsClient />;
}
