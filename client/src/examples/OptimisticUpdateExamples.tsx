/**
 * Optimistic UI Update Examples
 * 
 * Demonstrates various use cases for optimistic updates
 */

import { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import {
  useOptimisticMutation,
  useOptimisticList,
  useOptimisticUpdates,
} from 'src/lib/hooks'

interface Todo {
  id: string | number
  title: string
  completed: boolean
  _optimistic?: boolean
}

/**
 * Example 1: Optimistic Todo List
 */
function OptimisticTodoList() {
  const [newTodoTitle, setNewTodoTitle] = useState('')
  const {
    items: todos,
    addItem,
    updateItem,
    removeItem,
    hasPendingUpdate,
  } = useOptimisticList<Todo>([
    { id: 1, title: 'Learn Optimistic Updates', completed: false },
    { id: 2, title: 'Build Amazing UI', completed: false },
  ])

  const createMutation = useOptimisticMutation<Todo, { title: string }>({
    entityType: 'todo',
    updateType: 'create',
    optimisticDataFn: (variables) => ({
      id: `temp_${Date.now()}`,
      title: variables.title,
      completed: false,
      _optimistic: true,
    }),
    onSuccess: (serverData) => {
      // Replace temporary item with server data
      const tempId = `temp_${Date.now()}`
      updateItem(tempId, serverData)
    },
  })

  const deleteMutation = useOptimisticMutation<void, { id: string | number }>({
    entityType: 'todo',
    updateType: 'delete',
    optimisticDataFn: () => undefined,
    getEntityId: (variables) => variables.id,
    rollbackFn: (variables) => {
      // Restore deleted item
      const deletedTodo = todos.find((t) => t.id === variables.id)
      if (deletedTodo) {
        addItem(deletedTodo)
      }
    },
  })

  const toggleMutation = useOptimisticMutation<
    Todo,
    { id: string | number; completed: boolean }
  >({
    entityType: 'todo',
    updateType: 'update',
    optimisticDataFn: (variables) => {
      const todo = todos.find((t) => t.id === variables.id)
      return { ...todo!, completed: variables.completed }
    },
    getEntityId: (variables) => variables.id,
  })

  const handleAddTodo = async () => {
    if (!newTodoTitle.trim()) return

    addItem(
      {
        id: `temp_${Date.now()}`,
        title: newTodoTitle,
        completed: false,
      },
      { temporary: true }
    )

    await createMutation.mutate('/api/todos', { title: newTodoTitle })
    setNewTodoTitle('')
  }

  const handleDeleteTodo = async (id: string | number) => {
    removeItem(id)
    await deleteMutation.mutate(`/api/todos/${id}`, { id })
  }

  const handleToggleTodo = async (id: string | number, completed: boolean) => {
    updateItem(id, { completed })
    await toggleMutation.mutate(`/api/todos/${id}`, { id, completed })
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Example 1: Optimistic Todo List
        </Typography>
        <Typography variant='body2' color='text.secondary' gutterBottom>
          Add, toggle, and delete todos with instant UI feedback
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 2 }}>
          <TextField
            size='small'
            fullWidth
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder='New todo...'
            onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
          />
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleAddTodo}
            disabled={!newTodoTitle.trim()}
          >
            Add
          </Button>
        </Box>

        <List>
          {todos.map((todo) => (
            <ListItem
              key={todo.id}
              sx={{
                opacity: todo._optimistic ? 0.6 : 1,
                bgcolor: hasPendingUpdate(todo.id) ? 'action.hover' : 'transparent',
              }}
            >
              <ListItemText
                primary={todo.title}
                secondary={
                  hasPendingUpdate(todo.id) ? (
                    <Chip label='Saving...' size='small' />
                  ) : null
                }
                sx={{
                  textDecoration: todo.completed ? 'line-through' : 'none',
                }}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge='end'
                  onClick={() => handleToggleTodo(todo.id, !todo.completed)}
                  disabled={hasPendingUpdate(todo.id)}
                >
                  <CheckIcon color={todo.completed ? 'success' : 'disabled'} />
                </IconButton>
                <IconButton
                  edge='end'
                  onClick={() => handleDeleteTodo(todo.id)}
                  disabled={hasPendingUpdate(todo.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {todos.length === 0 && (
          <Typography variant='body2' color='text.secondary' align='center' sx={{ py: 4 }}>
            No todos yet. Add one above!
          </Typography>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Example 2: Like Button with Optimistic Update
 */
function OptimisticLikeButton() {
  const [likes, setLikes] = useState(42)
  const [isLiked, setIsLiked] = useState(false)

  const likeMutation = useOptimisticMutation<
    { likes: number; isLiked: boolean },
    { postId: number }
  >({
    entityType: 'like',
    updateType: 'update',
    optimisticDataFn: () => {
      const newIsLiked = !isLiked
      return {
        likes: newIsLiked ? likes + 1 : likes - 1,
        isLiked: newIsLiked,
      }
    },
    onSuccess: (data) => {
      setLikes(data.likes)
      setIsLiked(data.isLiked)
    },
    rollbackFn: () => {
      setLikes(likes)
      setIsLiked(isLiked)
    },
  })

  const handleLike = async () => {
    // Optimistic update
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikes(newIsLiked ? likes + 1 : likes - 1)

    // API call
    await likeMutation.mutate('/api/posts/1/like', { postId: 1 })
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Example 2: Optimistic Like Button
        </Typography>
        <Typography variant='body2' color='text.secondary' gutterBottom>
          Instant feedback when liking a post
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3 }}>
          <Button
            variant={isLiked ? 'contained' : 'outlined'}
            color='primary'
            onClick={handleLike}
            disabled={likeMutation.loading}
            startIcon={likeMutation.isOptimistic ? <CircularProgress size={16} /> : null}
          >
            {isLiked ? 'Liked' : 'Like'}
          </Button>
          <Typography variant='body1'>{likes} likes</Typography>
          {likeMutation.isOptimistic && (
            <Chip label='Saving...' size='small' color='primary' />
          )}
        </Box>

        {likeMutation.error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            Failed to update like. Changes rolled back.
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Example 3: Form with Optimistic Update
 */
function OptimisticProfileForm() {
  const [name, setName] = useState('John Doe')
  const [email, setEmail] = useState('john@example.com')

  const updateMutation = useOptimisticMutation<
    { name: string; email: string },
    { name: string; email: string }
  >({
    entityType: 'profile',
    updateType: 'update',
    optimisticDataFn: (variables) => variables,
    onSuccess: () => {
      // Profile updated successfully
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateMutation.mutate('/api/profile', { name, email })
  }

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Example 3: Profile Form with Optimistic Update
        </Typography>
        <Typography variant='body2' color='text.secondary' gutterBottom>
          Form stays responsive while saving
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label='Name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={updateMutation.loading}
            />
            <TextField
              label='Email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={updateMutation.loading}
            />
            <Button
              type='submit'
              variant='contained'
              disabled={updateMutation.loading}
            >
              {updateMutation.loading ? 'Saving...' : 'Save Profile'}
            </Button>

            {updateMutation.isOptimistic && (
              <Alert severity='info'>
                Changes saved locally. Syncing with server...
              </Alert>
            )}

            {updateMutation.data && !updateMutation.isOptimistic && (
              <Alert severity='success'>Profile updated successfully!</Alert>
            )}

            {updateMutation.error && (
              <Alert severity='error'>
                Failed to update profile: {updateMutation.error.message}
              </Alert>
            )}
          </Box>
        </form>
      </CardContent>
    </Card>
  )
}

/**
 * Example 4: Global Update Monitor
 */
function OptimisticUpdateMonitor() {
  const { updates, pending, failed, hasPending, hasFailed, stats } =
    useOptimisticUpdates()

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Example 4: Update Monitor
        </Typography>
        <Typography variant='body2' color='text.secondary' gutterBottom>
          Track all optimistic updates across the app
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mt: 2 }}>
          <Paper sx={{ p: 2, bgcolor: 'primary.light' }}>
            <Typography variant='body2' color='white'>
              Total
            </Typography>
            <Typography variant='h4' color='white'>
              {stats.total}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'warning.light' }}>
            <Typography variant='body2' color='white'>
              Pending
            </Typography>
            <Typography variant='h4' color='white'>
              {stats.pending}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'success.light' }}>
            <Typography variant='body2' color='white'>
              Success
            </Typography>
            <Typography variant='h4' color='white'>
              {stats.success}
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, bgcolor: 'error.light' }}>
            <Typography variant='body2' color='white'>
              Failed
            </Typography>
            <Typography variant='h4' color='white'>
              {stats.failed}
            </Typography>
          </Paper>
        </Box>

        {hasPending && (
          <Alert severity='info' sx={{ mt: 2 }}>
            {pending.length} update(s) in progress...
          </Alert>
        )}

        {hasFailed && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {failed.length} update(s) failed and were rolled back
          </Alert>
        )}

        {updates.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant='subtitle2' gutterBottom>
              Recent Updates:
            </Typography>
            <List dense>
              {updates.slice(0, 5).map((update) => (
                <ListItem key={update.id}>
                  <ListItemText
                    primary={`${update.type} ${update.entityType}`}
                    secondary={`Status: ${update.status}`}
                  />
                  <Chip
                    label={update.status}
                    size='small'
                    color={
                      update.status === 'success'
                        ? 'success'
                        : update.status === 'failed'
                        ? 'error'
                        : 'warning'
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Main Examples Component
 */
export default function OptimisticUpdateExamples() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant='h4' gutterBottom>
        Optimistic UI Update Examples
      </Typography>
      <Typography variant='body1' color='text.secondary' paragraph>
        These examples demonstrate instant UI feedback with automatic rollback on failure.
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <OptimisticTodoList />
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          <OptimisticLikeButton />
          <OptimisticProfileForm />
        </Box>
        <OptimisticUpdateMonitor />
      </Box>
    </Box>
  )
}
