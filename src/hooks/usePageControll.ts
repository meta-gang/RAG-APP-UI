/**
 * 페이지 네비게이션을 관리하는 커스텀 훅
 *
 * - 내부적으로 Recoil의 naviState를 업데이트하고 react-router의 navigate를 호출합니다.
 * @returns navigation 상태과 페이지 변경용 핸들러들
 */
import { naviState } from 'src/globals/recoil/atoms';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';

const usePageControll = () => {
  const navigate = useNavigate();
  const [navigation, set_navigation] = useRecoilState(naviState);
  /**
   * 현재 페이지를 변경하고 히스토리에도 추가합니다.
   * @param name 이동할 페이지 이름
   */
  const handlePage = (name: string) => {
    set_navigation((prev) => ({
      page: name,
      history: [...prev.history, name],
    }));
    return navigate(`/${name}`);
  };

  /**
   * 이전 페이지로 이동하고 내부 히스토리에서 마지막 항목을 제거합니다.
   */
  const handlePrevPage = () => {
    const backUrl = navigation.history[navigation.history.length - 2];
    set_navigation({
      page: backUrl,
      history: navigation.history.slice(0, navigation.history.length - 1),
    });
    return navigate(-1);
  };
  return { navigation, handlePage, handlePrevPage };
};

export default usePageControll;
