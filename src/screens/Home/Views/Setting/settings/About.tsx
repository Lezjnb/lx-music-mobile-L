import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Section from '../components/Section'
// import Button from './components/Button'

import { createStyle, openUrl } from '@/utils/tools'
// import { showPactModal } from '@/navigation'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { showPactModal } from '@/core/common'

// const qqGroupUrl = 'mqqopensdkapi://bizAgent/qm/qr?url=http%3A%2F%2Fqm.qq.com%2Fcgi-bin%2Fqm%2Fqr%3Ffrom%3Dapp%26p%3Dandroid%26jump_from%3Dwebapi%26k%3Du1zyxek8roQAwic44nOkBXtG9CfbAxFw'
// const qqGroupUrl2 = 'mqqopensdkapi://bizAgent/qm/qr?url=http%3A%2F%2Fqm.qq.com%2Fcgi-bin%2Fqm%2Fqr%3Ffrom%3Dapp%26p%3Dandroid%26jump_from%3Dwebapi%26k%3D-l4kNZ2bPQAuvfCQFFhl1UoibvF5wcrQ'
// const qqGroupWebUrl = 'https://qm.qq.com/cgi-bin/qm/qr?k=jRZkyFSZ4FmUuTHA3P_RAXbbUO_Rrn5e&jump_from=webapi'
// const qqGroupWebUrl2 = 'https://qm.qq.com/cgi-bin/qm/qr?k=HPNJEfrZpBZ9T8szYWbe2d5JrAAeOt_l&jump_from=webapi'

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()
  const openProjectPage = () => {
    void openUrl('https://github.com/Lezjnb/lx-music-mobile-L#readme')
  }
  const openProjectIssuePage = () => {
    void openUrl('https://github.com/Lezjnb/lx-music-mobile-L/issues')
  }
  const openProjectReleasePage = () => {
    void openUrl('https://github.com/Lezjnb/lx-music-mobile-L/releases')
  }
  const openOriginalProjectPage = () => {
    void openUrl('https://github.com/lyswhut/lx-music-mobile#readme')
  }
  const openOriginalFAQPage = () => {
    void openUrl('https://lyswhut.github.io/lx-music-doc/mobile/faq')
  }
  const openPactModal = () => {
    showPactModal()
  }
  const openOriginalPactPage = () => {
    void openUrl('https://github.com/lyswhut/lx-music-mobile#%E9%A1%B9%E7%9B%AE%E5%8D%8F%E8%AE%AE')
  }

  const textLinkStyle = {
    ...styles.text,
    textDecorationLine: 'underline',
    color: theme['c-primary-font'],
    // fontSize: 14,
  } as const


  return (
    <Section title={t('setting_about')}>
      <View style={styles.part}>
        <Text style={styles.text}><Text style={styles.boldText}>LX Music-L</Text> 是基于 LX Music 移动版的个人维护分支，完全免费、开源发布。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>本项目地址：</Text>
        <TouchableOpacity onPress={openProjectPage}>
          <Text style={textLinkStyle}>https://github.com/Lezjnb/lx-music-mobile-L</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>最新版下载地址：</Text>
        <TouchableOpacity onPress={openProjectReleasePage}>
          <Text style={textLinkStyle}>GitHub Releases</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>功能建议或问题反馈请到本项目 GitHub </Text>
        <TouchableOpacity onPress={openProjectIssuePage}>
          <Text style={textLinkStyle}>提交 Issue</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>当前版本的更新检查与安装包均由本项目 GitHub Release 提供。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>你已签署本软件的</Text>
        <TouchableOpacity onPress={openPactModal}><Text style={styles.text} color={theme['c-primary-font']}>许可协议</Text></TouchableOpacity>
        <Text style={styles.text}>。</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.part}>
        <Text style={styles.sectionTitle}>原项目与致谢</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>LX Music-L 基于原项目 LX Music 移动版开发，感谢原作者及所有贡献者。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>原项目地址：</Text>
        <TouchableOpacity onPress={openOriginalProjectPage}>
          <Text style={textLinkStyle}>https://github.com/lyswhut/lx-music-mobile</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>原项目文档与常见问题：</Text>
        <TouchableOpacity onPress={openOriginalFAQPage}>
          <Text style={textLinkStyle}>移动版常见问题</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>原项目协议在线版本：</Text>
        <TouchableOpacity onPress={openOriginalPactPage}><Text style={textLinkStyle}>项目协议</Text></TouchableOpacity>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>原项目作者：落雪无痕（lyswhut）</Text>
      </View>
    </Section>
  )
})

const styles = createStyle({
  part: {
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 14,
    textAlignVertical: 'bottom',
  },
  boldText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlignVertical: 'bottom',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlignVertical: 'bottom',
  },
  divider: {
    height: 1,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 15,
    backgroundColor: 'rgba(127, 127, 127, .35)',
  },
  btn: {
    flexDirection: 'row',
  },
})
