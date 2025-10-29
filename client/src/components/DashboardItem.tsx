import React from 'react'
import { Card, CardContent, Grid, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
export default function DashboardItem({
  icon,
  children,
  title,
  color = '#000',
  backgroundColor = '#FFF',
}: {
  icon?: React.JSX.Element
  children: React.JSX.Element | string
  title: React.JSX.Element | string
  color?: string
  backgroundColor?: string
}) {
  return (
    <Card>
      <CardContent
        style={{
          backgroundColor: alpha(backgroundColor, 0.4),
          margin: '0px',
          padding: '0px',
        }}
      >
        <Grid container>
          {icon && (
            <Grid
              item
              xs={5}
              style={{
                backgroundColor: alpha(backgroundColor, 0.4),
                padding: '10px',
              }}
            >
              {icon}
            </Grid>
          )}
          <Grid
            item
            xs={icon ? 7 : 12}
            style={{
              padding: '10px',
            }}
          >
            {title && (
              <Typography variant='body1' color={color} gutterBottom>
                {title}
              </Typography>
            )}
            {children}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}
