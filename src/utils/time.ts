import { formatDistanceToNow, parseISO, differenceInSeconds } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatTimeAgo = (dateString: string): string => {
  if (!dateString) {
    return '';
  }
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const seconds = differenceInSeconds(now, date);

    if (seconds < 60) {
      return '방금 전';
    }

    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  } catch (error) {
    console.error("Invalid date string for formatTimeAgo:", dateString);
    return dateString; // Return original string on parsing failure
  }
};