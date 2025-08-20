import { naviState } from 'src/globals/recoil/atoms';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';

const usePageControll = () => {
  const navigate = useNavigate();
  const [navigation, set_navigation] = useRecoilState(naviState);
  const handlePage = (name: string) => {
    set_navigation((prev) => ({
      page: name,
      history: [...prev.history, name],
    }));
    return navigate(`/${name}`);
  };
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
