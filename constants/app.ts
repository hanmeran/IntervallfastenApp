export const GRACE_PERIOD_SECONDS = 300; // 5 Minuten Karenzzeit
export const MAX_PLANS = 7; // Maximale Anzahl an Fastenplänen

export const STATUS_CONFIG = {
  completed: { label: 'Erfolgreich', color: '#10B981', bgColor: '#ECFDF5' },
  extended: { label: 'Überzogen', color: '#06B6D4', bgColor: '#E0F7FA' },
  nearly_there: { label: 'Knapp verfehlt', color: '#F59900', bgColor: '#FFFBEB' }, // Adjusted color for better contrast
  aborted: { label: 'Abgebrochen', color: '#EF4444', bgColor: '#FEF2F2' },
};