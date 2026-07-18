import Content from './Content'
import PlayerBar from '@/components/player/PlayerBar'
import BottomNavigation from '../BottomNavigation'

export default () => {
  return (
    <>
      <Content />
      <PlayerBar isHome />
      <BottomNavigation />
    </>
  )
}
