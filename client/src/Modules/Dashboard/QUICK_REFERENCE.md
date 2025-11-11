# Dashboard Module - Quick Reference

## 🚀 Quick Start

```typescript
// Import the management hook
import { useDashboardManagement } from 'src/Modules/Dashboard'

// Use in your component
const MyComponent = () => {
  const {
    stats,
    recentApplications,
    recommendations,
    isLoading,
    refreshAll
  } = useDashboardManagement()

  if (isLoading) return <Loading />

  return (
    <div>
      <h1>Applications: {stats?.applications_count}</h1>
      <button onClick={refreshAll}>Refresh</button>
    </div>
  )
}
```

---

## 📚 Available Hooks

### Query Hooks
```typescript
import {
  useOverview,
  useStats,
  useRecentApplications,
  useRecommendations,
  useDashboardData
} from 'src/Modules/Dashboard'

// Complete overview
const { data, isLoading } = useOverview()

// Stats only
const { data: stats } = useStats()

// Recent applications
const { data: apps } = useRecentApplications({ limit: 5 })

// Recommendations
const { data: recs } = useRecommendations({ limit: 10 })

// All data at once
const { overview, isLoading } = useDashboardData(10, 10)
```

### Management Hook
```typescript
import { useDashboardManagement } from 'src/Modules/Dashboard'

const dashboard = useDashboardManagement()

// Access data
dashboard.stats                    // DashboardStats
dashboard.recentApplications       // RecentApplication[]
dashboard.recommendations          // JobRecommendation[]
dashboard.recentActivity          // RecentActivity[]
dashboard.isLoading               // boolean
dashboard.error                   // Error | null

// Actions
dashboard.refreshAll()            // Refresh all data
dashboard.setViewMode('overview') // Change view
dashboard.setFilters({...})       // Update filters
dashboard.resetFilters()          // Clear filters

// Navigation
dashboard.navigateToJob(123)
dashboard.navigateToApplication(456)
dashboard.navigateToApplications()
dashboard.navigateToSavedJobs()
dashboard.navigateToProfile()
dashboard.navigateToJobSearch()

// Computed
dashboard.hasData                 // boolean
dashboard.isEmpty                 // boolean
```

---

## 🔧 Service Methods

```typescript
import { dashboardService } from 'src/Modules/Dashboard'

// Fetch complete overview
const overview = await dashboardService.getOverview()

// Fetch stats only
const stats = await dashboardService.getStats()

// Fetch recent applications
const apps = await dashboardService.getRecentApplications({ limit: 5 })

// Fetch recommendations
const recs = await dashboardService.getRecommendations({ limit: 10 })

// Refresh all data
const allData = await dashboardService.refreshAll(10, 10)
```

---

## 📊 Type Definitions

### Main Types
```typescript
interface DashboardStats {
  applications_count: number
  interviews_scheduled: number
  saved_jobs: number
  profile_views: number
}

interface RecentApplication {
  id: number
  job_title: string
  company_name: string
  status: string
  applied_at: string
}

interface JobRecommendation {
  id: number
  job_title: string
  company_name: string
  location: string
  match_score: number
  posted_date: string | null
}

interface DashboardOverviewResponse {
  stats: DashboardStats
  recent_applications: RecentApplication[]
  upcoming_interviews: UpcomingInterview[]
  recommendations: JobRecommendation[]
  recent_activity: RecentActivity[]
}
```

---

## 🎯 Common Patterns

### Basic Dashboard Screen
```typescript
import { useDashboardManagement } from 'src/Modules/Dashboard'

const Dashboard = () => {
  const {
    stats,
    recentApplications,
    recommendations,
    isLoading,
    error
  } = useDashboardManagement()

  if (isLoading) return <Loading />
  if (error) return <Error error={error} />

  return (
    <div>
      <StatsCards stats={stats} />
      <ApplicationsList applications={recentApplications} />
      <RecommendationsList recommendations={recommendations} />
    </div>
  )
}
```

### With Refresh Button
```typescript
const { stats, isLoading, refreshAll } = useDashboardManagement()

<Button 
  onClick={refreshAll} 
  disabled={isLoading}
>
  {isLoading ? 'Refreshing...' : 'Refresh'}
</Button>
```

### With Navigation
```typescript
const { recommendations, navigateToJob } = useDashboardManagement()

{recommendations.map(rec => (
  <JobCard 
    key={rec.id} 
    job={rec} 
    onClick={() => navigateToJob(rec.id)}
  />
))}
```

### With Filters
```typescript
const { 
  data, 
  filters, 
  setFilters, 
  resetFilters 
} = useDashboardManagement()

<DateRangePicker 
  value={filters.dateRange}
  onChange={(range) => setFilters({ dateRange: range })}
/>

<Button onClick={resetFilters}>Clear Filters</Button>
```

---

## 🧪 Testing

### Service Tests
```typescript
import { dashboardService } from 'src/Modules/Dashboard'

it('fetches overview', async () => {
  const result = await dashboardService.getOverview()
  expect(result.data).toBeDefined()
})
```

### Hook Tests
```typescript
import { renderHook } from '@testing-library/react'
import { useOverview } from 'src/Modules/Dashboard'

it('fetches overview data', async () => {
  const { result } = renderHook(() => useOverview(), {
    wrapper: QueryWrapper
  })
  
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })
})
```

---

## 📁 File Locations

```
Modules/Dashboard/
├── types/api.types.ts          - Type definitions
├── services/dashboard.service.ts - API service
├── hooks/useDashboardQuery.ts  - Query hooks
├── hooks/useDashboardManagement.ts - Management hook
├── screens/Dashboard.tsx       - Main screen
├── routes/routes.tsx          - Routing
├── tests/dashboard.test.tsx   - Tests
└── index.ts                   - Public exports
```

---

## 🔗 Related Files

- **API Config**: `src/services/api/config.ts`
  - `ENDPOINTS.dashboard.*`
  - `QUERY_KEYS.dashboard.*`

- **API Client**: `src/services/api/api-client.ts`

- **Store**: `src/store` (for user state)

---

## 📞 Troubleshooting

### Data not loading?
```typescript
// Check query key in DevTools
// Verify API endpoint in Network tab
// Check authentication status

const { error, isLoading } = useOverview()
console.log({ error, isLoading })
```

### Cache not updating?
```typescript
// Force refetch
const { refetch } = useOverview()
refetch()

// Or use management hook
const { refreshAll } = useDashboardManagement()
refreshAll()
```

### Types not working?
```typescript
// Make sure to import from module
import type { DashboardStats } from 'src/Modules/Dashboard'

// Not from the service directly
// ❌ import { DashboardStats } from './services/dashboard.service'
```

---

## 🎯 Best Practices

1. **Always use the management hook in screens**
   ```typescript
   // ✅ Good
   const dashboard = useDashboardManagement()
   
   // ❌ Bad - Don't use service directly in components
   const data = await dashboardService.getOverview()
   ```

2. **Use query hooks for specific data needs**
   ```typescript
   // ✅ Good - When you only need stats
   const { data: stats } = useStats()
   
   // ❌ Bad - Fetching more than needed
   const { data: overview } = useOverview()
   const stats = overview?.stats
   ```

3. **Handle loading and error states**
   ```typescript
   // ✅ Good
   if (isLoading) return <Loading />
   if (error) return <Error error={error} />
   return <Content data={data} />
   ```

4. **Use TypeScript types**
   ```typescript
   // ✅ Good
   const stats: DashboardStats = dashboard.stats
   
   // ❌ Bad
   const stats: any = dashboard.stats
   ```

---

## 🚀 Performance Tips

1. **Use staleTime to control refetch frequency**
   ```typescript
   useOverview({
     staleTime: 10 * 60 * 1000 // 10 minutes
   })
   ```

2. **Disable unnecessary queries**
   ```typescript
   useStats({
     enabled: false // When data is in overview
   })
   ```

3. **Use React.memo for expensive components**
   ```typescript
   const StatsCard = React.memo(({ stats }) => {
     // Component code
   })
   ```

---

## 📝 Migration from Old Code

### Before (Old Pattern)
```typescript
const [data, setData] = useState()
const [loading, setLoading] = useState(false)

useEffect(() => {
  const fetchData = async () => {
    setLoading(true)
    const result = await dashboardService.getOverview()
    setData(result.data)
    setLoading(false)
  }
  fetchData()
}, [])
```

### After (New Pattern)
```typescript
const { data, isLoading } = useDashboardManagement()
```

---

**Last Updated**: November 8, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
