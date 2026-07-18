import { useRef } from 'react'
import { TouchableOpacity } from 'react-native'
import AiTranslatePopup, { type AiTranslatePopupType } from '../../Vertical/Player/components/MoreBtn/AiTranslatePopup'
import { TranslateIcon } from '@/components/common/CustomIcons'
import { useTheme } from '@/store/theme/hook'
import { BTN_WIDTH, BTN_ICON_SIZE } from './Btn'

export default () => {
  const theme = useTheme()
  const popupRef = useRef<AiTranslatePopupType>(null)
  return (
    <>
      <TouchableOpacity style={{ width: BTN_WIDTH, height: BTN_WIDTH, marginBottom: 5, alignItems: 'center', justifyContent: 'center' }} activeOpacity={0.5} onPress={() => { popupRef.current?.show() }}>
        <TranslateIcon size={BTN_ICON_SIZE} color={theme['c-font-label']} />
      </TouchableOpacity>
      <AiTranslatePopup ref={popupRef} />
    </>
  )
}
