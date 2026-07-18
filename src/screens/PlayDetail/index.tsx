import { useEffect } from 'react'
// import { View, StyleSheet } from 'react-native'
import { useHorizontalMode } from '@/utils/hooks'

import Vertical from './Vertical'
import Horizontal from './Horizontal'
import PageContent from '@/components/PageContent'
import StatusBar from '@/components/common/StatusBar'
import { setComponentId } from '@/core/common'
import { COMPONENT_IDS } from '@/config/constant'
import { useSettingValue } from '@/store/setting/hook'
import PageBackground from '@/components/PageBackground'

export default ({ componentId }: { componentId: string }) => {
  const isHorizontalMode = useHorizontalMode()
  const backgroundOpacity = useSettingValue('playDetail.ui.backgroundOpacity')

  useEffect(() => {
    setComponentId(COMPONENT_IDS.playDetail, componentId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PageContent overlayOpacity={backgroundOpacity}>
      <PageBackground page="playDetail">
        <StatusBar />
        {
          isHorizontalMode
            ? <Horizontal componentId={componentId} />
            : <Vertical componentId={componentId} />
        }
      </PageBackground>
    </PageContent>
  )
}
