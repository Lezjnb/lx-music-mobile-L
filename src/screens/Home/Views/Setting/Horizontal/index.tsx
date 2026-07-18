import { useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import NavList from './NavList'
import Main, { type MainType } from '../Main'
import { createStyle } from '@/utils/tools'
import { BorderWidths } from '@/theme'
import { useTheme } from '@/store/theme/hook'
import Input from '@/components/common/Input'

const styles = createStyle({
  container: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: BorderWidths.normal,
  },
  nav: {
    height: '100%',
    width: '22%',
    borderRightWidth: BorderWidths.normal,
  },
  main: {
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15,
    paddingBottom: 15,
    flex: 0,
  },
  search: {
    marginHorizontal: 8,
    marginVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(127,127,127,0.15)',
  },
  searchContainer: {
    flexGrow: 0,
    width: '100%',
  },
})

export default () => {
  const theme = useTheme()
  const mainRef = useRef<MainType>(null)
  const [query, setQuery] = useState('')

  return (
    <View style={{ ...styles.container, borderTopColor: theme['c-border-background'] }}>
      <View style={{ ...styles.nav, borderRightColor: theme['c-border-background'] }}>
        <Input value={query} onChangeText={setQuery} placeholder="搜索设置" clearBtn style={styles.search} containerStyle={styles.searchContainer} />
        <NavList query={query} onChangeId={(id) => mainRef.current?.setActiveId(id)} />
      </View>
      <ScrollView keyboardShouldPersistTaps={'always'}>
        <View style={styles.main}>
          <Main ref={mainRef} />
        </View>
      </ScrollView>
    </View>
  )
}
