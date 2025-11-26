/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환합니다.
 * @returns 포맷된 날짜 문자열 (예: "2025-11-26")
 */
export const getFormattedDate = () => {
  const today = new Date();
  return formatDate(today);
};

/**
 * 주어진 Date 객체를 YYYY-MM-DD 형식의 문자열로 포맷합니다.
 * @param date 포맷할 Date 객체
 * @returns 포맷된 날짜 문자열
 */
export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
