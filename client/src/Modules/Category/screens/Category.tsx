// src/Modules/CategoryManagement/screens/CategoryManagement.tsx
// ✅ COMPLETE EXAMPLE: Full CRUD operations with the new architecture

import React, { useState } from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  IconButton,
  Alert,
  Snackbar,
  CircularProgress,
  Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import { useCategories } from '@/shared/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryService, QUERY_KEYS } from '@/shared/api'
import { ICategory } from 'src/lib/types'

const CategoryManagement = () => {
  const queryClient = useQueryClient()
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  // ✅ Fetch categories using shared hook
  const {
    data: categoriesResponse,
    isLoading,
    error,
    refetch,
  } = useCategories()

  // ✅ Create category mutation
  const createCategory = useMutation({
    mutationFn: (data: any) => categoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      setSnackbar({ open: true, message: 'Category created successfully!', severity: 'success' })
      handleCloseDialog()
    },
    onError: (error: any) => {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to create category', 
        severity: 'error' 
      })
    },
  })

  // ✅ Update category mutation
  const updateCategory = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      categoryService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      setSnackbar({ open: true, message: 'Category updated successfully!', severity: 'success' })
      handleCloseDialog()
    },
    onError: (error: any) => {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to update category', 
        severity: 'error' 
      })
    },
  })

  // ✅ Delete category mutation
  const deleteCategory = useMutation({
    mutationFn: (id: number) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories })
      setSnackbar({ open: true, message: 'Category deleted successfully!', severity: 'success' })
    },
    onError: (error: any) => {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to delete category', 
        severity: 'error' 
      })
    },
  })

  const categories = categoriesResponse?.data || []

  const handleOpenDialog = (category?: ICategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name || '',
        description: category.description || '',
      })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', description: '' })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
  }

  const handleSubmit = () => {
    if (editingCategory) {
      updateCategory.mutate({ id: editingCategory.id, data: formData })
    } else {
      createCategory.mutate(formData)
    }
  }

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      deleteCategory.mutate(id)
    }
  }

  const isSubmitting = createCategory.isPending || updateCategory.isPending

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            Category Management
          </Typography>
          <Stack direction="row" spacing={2}>
            <IconButton onClick={() => refetch()} color="primary">
              <RefreshIcon />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Add Category
            </Button>
          </Stack>
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error.message || 'Failed to load categories'}
          </Alert>
        )}

        {/* Categories List */}
        {!isLoading && !error && (
          <Stack spacing={2}>
            {categories.length === 0 ? (
              <Alert severity="info">
                No categories found. Click "Add Category" to create one.
              </Alert>
            ) : (
              categories.map((category) => (
                <Card key={category.id}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="h6">{category.name}</Typography>
                        {category.description && (
                          <Typography variant="body2" color="text.secondary">
                            {category.description}
                          </Typography>
                        )}
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog(category)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(category.id)}
                          disabled={deleteCategory.isPending}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingCategory ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Category Name"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!formData.name || isSubmitting}
            >
              {isSubmitting ? <CircularProgress size={24} /> : editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  )
}

export default CategoryManagement
