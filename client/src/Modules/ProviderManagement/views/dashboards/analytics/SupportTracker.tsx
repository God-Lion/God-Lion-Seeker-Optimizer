/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo } from 'react'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { useColorScheme, useTheme } from '@mui/material/styles'
import classnames from 'classnames'
import type { ApexOptions } from 'apexcharts'
import type { ThemeColor, SystemMode } from 'src/lib/types'

// Components Imports
import OptionMenu from 'src/core/components/option-menu'
import CustomAvatar from 'src/core/components/mui/Avatar'
import ErrorBoundary from 'src/components/ErrorBoundary'

// Util Imports
import { rgbaToHex } from 'src/lib/utils'
import { Box } from '@mui/material'

const AppReactApexCharts = React.lazy(
  () => import('src/lib/styles/AppReactApexCharts'),
)

// Styled Component Imports
// const AppReactApexCharts = dynamic(() => import('src/libs/styles/AppReactApexCharts'))

type DataType = {
  title: string
  subtitle: string
  avatarIcon: string
  avatarColor?: ThemeColor
}

// Vars
const data: Array<DataType> = [
  {
    title: 'New Tickets',
    subtitle: '142',
    avatarColor: 'primary',
    avatarIcon: 'tabler-ticket',
  },
  // {
  //   title: 'Open Tickets',
  //   subtitle: '28',
  //   avatarColor: 'info',
  //   avatarIcon: 'tabler-check',
  // },
  {
    title: 'Response Time',
    subtitle: '1 Day',
    avatarColor: 'warning',
    avatarIcon: 'tabler-clock',
  },
]

const SupportTracker: React.FC = () => {
  const theme = useTheme()
  const { mode } = useColorScheme()
  const series = useMemo(() => [32, 41, 41, 70], [])

  // Vars
  // const _mode = (mode === 'system' ? serverMode : mode) || serverMode

  // Vars
  // const textSecondary = rgbaToHex(
  //   `rgb(${theme.mainColorChannels[_mode]} / 0.7)`,
  // )
  const successColor = theme.palette.success.main

  // Vars
  // const _mode = (mode === 'system' ? serverMode : mode) || serverMode
  // const disabledText = rgbaToHex(`rgb(${theme.mainColorChannels[_mode]} / 0.4)`)

  // const options: ApexOptions = {
  //   stroke: { dashArray: 10 },
  //   labels: ['Completed Task'],
  //   colors: [theme.palette.primary.main],
  //   states: {
  //     hover: {
  //       filter: { type: 'none' },
  //     },
  //     active: {
  //       filter: { type: 'none' },
  //     },
  //   },
  //   fill: {
  //     type: 'gradient',
  //     gradient: {
  //       shade: 'dark',
  //       opacityTo: 0.5,
  //       opacityFrom: 1,
  //       shadeIntensity: 0.5,
  //       stops: [30, 70, 100],
  //       inverseColors: false,
  //       gradientToColors: [theme.palette.primary.main],
  //     },
  //   },
  //   plotOptions: {
  //     radialBar: {
  //       endAngle: 130,
  //       startAngle: -140,
  //       hollow: { size: '60%' },
  //       track: { background: 'transparent' },
  //       dataLabels: {
  //         name: {
  //           offsetY: -24,
  //           // color: disabledText,
  //           fontFamily: theme.typography.fontFamily,
  //           fontSize: theme.typography.body2.fontSize as string,
  //         },
  //         value: {
  //           offsetY: 8,
  //           fontWeight: 500,
  //           formatter: (value) => `${value}%`,
  //           // color: rgbaToHex(`rgb(${theme.mainColorChannels[_mode]} / 0.9)`),
  //           fontFamily: theme.typography.fontFamily,
  //           fontSize: theme.typography.h2.fontSize as string,
  //         },
  //       },
  //     },
  //   },
  //   grid: {
  //     padding: {
  //       top: -18,
  //       left: 0,
  //       right: 0,
  //       bottom: 14,
  //     },
  //   },
  //   responsive: [
  //     {
  //       breakpoint: 1380,
  //       options: {
  //         grid: {
  //           padding: {
  //             top: 8,
  //             left: 12,
  //           },
  //         },
  //       },
  //     },
  //     {
  //       breakpoint: 1280,
  //       options: {
  //         chart: {
  //           height: 325,
  //         },
  //         grid: {
  //           padding: {
  //             top: 12,
  //             left: 12,
  //           },
  //         },
  //       },
  //     },
  //     {
  //       breakpoint: 1201,
  //       options: {
  //         chart: {
  //           height: 362,
  //         },
  //       },
  //     },
  //     {
  //       breakpoint: 1135,
  //       options: {
  //         chart: {
  //           height: 350,
  //         },
  //       },
  //     },
  //     {
  //       breakpoint: 980,
  //       options: {
  //         chart: {
  //           height: 300,
  //         },
  //       },
  //     },
  //     {
  //       breakpoint: 900,
  //       options: {
  //         chart: {
  //           height: 350,
  //         },
  //       },
  //     },
  //   ],
  // }

  const options: ApexOptions = useMemo(() => ({
    // colors: [
    //   successColor,
    //   rgbaToHex(`rgb(${theme.palette.success.mainChannel} / 0.7)`),
    //   rgbaToHex(`rgb(${theme.palette.success.mainChannel} / 0.5)`),
    //   rgbaToHex(`rgb(${theme.palette.success.mainChannel} / 0.16)`),
    // ],
    stroke: { width: 0 },
    legend: { show: false },
    tooltip: { theme: 'false' },
    dataLabels: { enabled: false },
    labels: ['Electronic', 'Sports', 'Decor', 'Fashion'],
    states: {
      hover: {
        filter: { type: 'none' },
      },
      active: {
        filter: { type: 'none' },
      },
    },
    grid: {
      padding: {
        top: -22,
        bottom: -18,
        right: 15,
      },
    },
    plotOptions: {
      pie: {
        customScale: 0.8,
        expandOnClick: false,
        donut: {
          size: '73%',
          labels: {
            show: true,
            name: {
              offsetY: 25,
              // color: textSecondary,
              fontFamily: theme.typography.fontFamily,
            },
            value: {
              offsetY: -15,
              fontWeight: 500,
              formatter: (val) => `${val}`,
              // color: rgbaToHex(`rgb(${theme.mainColorChannels[_mode]} / 0.9)`),
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.h3.fontSize as string,
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Total',
              color: successColor,
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.body1.fontSize as string,
            },
          },
        },
      },
    },
  }), [theme.typography.fontFamily, successColor])
  return (
    <Card>
      <CardHeader
        title='Support Tracker'
        subheader='Last 7 Days'
        action={<OptionMenu options={['Refresh', 'Edit', 'Share']} />}
      />
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: {
            xl: 'row',
            sm: 'column',
          },
          alignItems: 'center',
          justifyContent: 'between',
          gap: '1.75rem',
        }}
        // className='flex flex-col sm:flex-row items-center justify-between gap-7'
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            inlineSize: { xl: '100%', sm: 'unset' },
          }}
          // className='flex flex-col gap-6 is-full sm:is-[unset]'
        >
          {/* <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
            }}
            // className='flex flex-col'
          >
            <Typography variant='h2'>164</Typography>
            <Typography>Total Tickets</Typography>
          </Box> */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              inlineSize: '100%',
            }}
            // className='flex flex-col gap-4 is-full'
          >
            {data.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
                // className='flex items-center gap-4'
              >
                <CustomAvatar
                  skin='light'
                  variant='rounded'
                  color={item.avatarColor}
                  size={34}
                >
                  {item.avatarIcon}
                  {/* <i className={classnames(item.avatarIcon, 'text-[22px]')} /> */}
                </CustomAvatar>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  // className='flex flex-col'
                >
                  <Typography
                    sx={{
                      fontMedium: 500,
                    }}
                    // className='font-medium'
                    color='text.primary'
                  >
                    {item.title}
                  </Typography>
                  <Typography variant='body2'>{item.subtitle}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        {/* <AppReactApexCharts
          type='radialBar'
          height={350}
          width='100%'
          series={[85]}
          options={options}
        /> */}
        <ErrorBoundary>
          <AppReactApexCharts
            type='donut'
            width={165}
            height={229}
            series={series}
            options={options}
          />
        </ErrorBoundary>
      </CardContent>
    </Card>
  )
}

export default SupportTracker
