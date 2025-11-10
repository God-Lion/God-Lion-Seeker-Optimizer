// import { renderHook, waitFor } from '@testing-library/react'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import { useChangePassword } from '../hooks/useAuthQuery'

// describe('useChangePassword', () => {
//   it('should change password successfully', async () => {
//     const queryClient = new QueryClient()
//     const wrapper = ({ children }) => (
//       <QueryClientProvider client={queryClient}>
//         {children}
//       </QueryClientProvider>
//     )

//     const { result } = renderHook(() => useChangePassword(), { wrapper })

//     result.current.mutate({
//       current_password: 'old123',
//       new_password: 'new123',
//       confirm_password: 'new123',
//     })

//     await waitFor(() => expect(result.current.isSuccess).toBe(true))
//   })
// })