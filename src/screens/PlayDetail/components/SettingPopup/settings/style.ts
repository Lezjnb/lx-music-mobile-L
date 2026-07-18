import { createStyle } from '@/utils/tools'

export default createStyle({
  container: {
    paddingTop: 5,
    paddingLeft: 15,
    paddingRight: 15,
    paddingBottom: 15,
    alignItems: 'flex-start',
  },
  // title: {

  // },
  label: {
    width: 50,
    textAlign: 'center',
  },
  content: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 5,
  },
  menu: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(127,127,127,0.15)',
  },
  opacity: {
    width: '100%',
    marginTop: 5,
  },
})
