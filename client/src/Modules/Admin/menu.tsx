import { IMenu } from 'src/components/layout/types'

const menu: Array<IMenu> = [
  // {
  //   name: 'dashboards',
  //   icon: 'Dashboard',
  //   link: 'admin/dashboard',
  // },
  // {
  //   name: 'appsPages',
  //   // icon: dashboard,
  //   link: 'admin/Dashboard',
  //   menusection: {
  //     name: `ACCOUNT MANAGEMENT`,
  //     menu: [
  //       {
  //         name: `PROVIDERS`,
  //         icon: 'ShieldOutlined',
  //         // suffix: (
  //         //   <CustomChip label='3' size='small' color='error' round='true' />
  //         // ),
  //         submenu: [
  //           {
  //             name: `list`,
  //             // icon: classes,
  //             link: `admin/provider`,
  //           },
  //           {
  //             name: `add new provider`,
  //             // icon: classes,
  //             link: `admin/provider/create`,
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // },
]

export const updateMenu = (): Array<IMenu> => {
  // Return static menu - the handleMenu API endpoint doesn't exist
  return menu
}

export default menu
