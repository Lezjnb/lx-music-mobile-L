import { useEffect, useMemo, useState } from 'react'
import Search from '../Views/Search'
import SongList from '../Views/SongList'
import Mylist from '../Views/Mylist'
import Leaderboard from '../Views/Leaderboard'
import Setting from '../Views/Setting'
import commonState, { type InitState as CommonState } from '@/store/common/state'
import PageBackground from '@/components/PageBackground'


const Main = () => {
  const [id, setId] = useState(commonState.navActiveId)

  useEffect(() => {
    const handleUpdate = (id: CommonState['navActiveId']) => {
      requestAnimationFrame(() => {
        setId(id)
      })
    }
    global.state_event.on('navActiveIdUpdated', handleUpdate)
    return () => {
      global.state_event.off('navActiveIdUpdated', handleUpdate)
    }
  }, [])

  const component = useMemo(() => {
    switch (id) {
      case 'nav_songlist': return <PageBackground page="songlist"><SongList /></PageBackground>
      case 'nav_top': return <PageBackground page="leaderboard"><Leaderboard /></PageBackground>
      case 'nav_love': return <PageBackground page="mylist"><Mylist /></PageBackground>
      case 'nav_setting': return <PageBackground page="setting"><Setting /></PageBackground>
      case 'nav_search':
      default: return <PageBackground page="search"><Search /></PageBackground>
    }
  }, [id])

  return component
}


export default Main
