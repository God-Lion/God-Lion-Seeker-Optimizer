import React from 'react'
import { IMenu } from 'src/components/layout/types'
import { handleMenu } from '../ProviderManagement/services/app'

const menu: Array<IMenu> = [
  {
    name: 'dashboards',
    icon: 'Dashboard',
    link: 'provider/dashboard',
  },
  // {
  //   name: 'appsPages',
  //   // icon: dashboard,
  //   link: 'admin/Dashboard',
  //   menusection: {
  //     name: `USER MANAGEMENT`,
  //     menu: [
  //       {
  //         name: `PROVIDERS`,
  //         icon: <ShieldOutlined />,
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
  {
    name: 'appsPages',
    // icon: dashboard,
    link: 'provider/dashboard',
    menusection: {
      name: `ACCOUNT MANAGEMENT`,
      menu: [
        {
          name: `Account Information`,
          icon: 'ShieldOutlined',
          link: 'provider/account/info',
          // suffix: (
          //   <CustomChip label='3' size='small' color='error' round='true' />
          // ),
        },
      ],
    },
  },
]
export const updateMenu = (): Array<IMenu> => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [menuItems, setMenuItems] = React.useState<Array<IMenu>>([])

  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    const fetchMenu = async () => {
      const response = await handleMenu()
      setMenuItems(response.data)
    }

    fetchMenu()
  }, [])

  return menuItems
}

export default menu
