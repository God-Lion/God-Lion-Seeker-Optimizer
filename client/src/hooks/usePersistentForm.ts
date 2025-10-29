/**
 * usePersistentForm Hook
 * 
 * Hook to persist form state across page reloads and navigation.
 * Useful for long forms where users might accidentally navigate away.
 * 
 * @example
 * const { formData, handleChange, handleSubmit, clearForm, isDirty } = usePersistentForm(
 *   'job-application-form',
 *   { name: '', email: '', resume: null },
 *   async (data) => {
 *     await submitApplication(data)
 *   }
 * )
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import StorageManager from 'src/lib/utils'

interface UsePersistentFormOptions<T> {
  storage?: 'session' | 'local'
  onSubmitSuccess?: (data: T) => void
  onSubmitError?: (error: any) => void
  validateOnChange?: boolean
  debounceDelay?: number
}

interface UsePersistentFormReturn<T> {
  formData: T
  errors: Record<string, string>
  isDirty: boolean
  isSubmitting: boolean
  handleChange: (field: keyof T, value: any) => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  setFormData: (data: T | ((prev: T) => T)) => void
  setFieldValue: (field: keyof T, value: any) => void
  setFieldError: (field: keyof T, error: string) => void
  clearForm: () => void
  resetForm: () => void
  restoreForm: () => void
  validateField: (field: keyof T) => boolean
  validateForm: () => boolean
}

export function usePersistentForm<T extends Record<string, any>>(
  formId: string,
  initialValues: T,
  onSubmit: (data: T) => Promise<void>,
  options: UsePersistentFormOptions<T> = {}
): UsePersistentFormReturn<T> {
  const {
    storage = 'session',
    onSubmitSuccess,
    onSubmitError,
    validateOnChange = false,
    debounceDelay = 500,
  } = options

  const storageKey = `form_state_${formId}`
  const storageObject = storage === 'session' ? sessionStorage : localStorage

  // Form state
  const [formData, setFormData] = useState<T>(() => {
    // Try to restore from storage
    try {
      const savedData = storageObject.getItem(storageKey)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        return { ...initialValues, ...parsed }
      }
    } catch (error) {
      console.error('Error restoring form data:', error)
    }
    return initialValues
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Ref to track initial values
  const initialValuesRef = useRef(initialValues)
  const debounceTimerRef = useRef<NodeJS.Timeout>()

  /**
   * Save form data to storage (debounced)
   */
  const saveToStorage = useCallback(
    (data: T) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        try {
          storageObject.setItem(storageKey, JSON.stringify(data))
        } catch (error) {
          console.error('Error saving form data:', error)
        }
      }, debounceDelay)
    },
    [storageKey, storageObject, debounceDelay]
  )

  /**
   * Save to storage when form data changes
   */
  useEffect(() => {
    if (isDirty) {
      saveToStorage(formData)
    }
  }, [formData, isDirty, saveToStorage])

  /**
   * Check if form is dirty (has changes)
   */
  useEffect(() => {
    const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialValuesRef.current)
    setIsDirty(hasChanges)
  }, [formData])

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))

      // Clear error for this field
      if (errors[field as string]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field as string]
          return newErrors
        })
      }

      // Validate on change if enabled
      if (validateOnChange) {
        validateField(field)
      }
    },
    [errors, validateOnChange]
  )

  /**
   * Set field value
   */
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  /**
   * Set field error
   */
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({
      ...prev,
      [field as string]: error,
    }))
  }, [])

  /**
   * Validate individual field (override this in options for custom validation)
   */
  const validateField = useCallback(
    (field: keyof T): boolean => {
      // Basic validation - check if required field is empty
      const value = formData[field]
      if (value === '' || value === null || value === undefined) {
        setFieldError(field, 'This field is required')
        return false
      }
      return true
    },
    [formData, setFieldError]
  )

  /**
   * Validate entire form (override this in options for custom validation)
   */
  const validateForm = useCallback((): boolean => {
    let isValid = true
    const newErrors: Record<string, string> = {}

    Object.keys(formData).forEach((key) => {
      const value = formData[key as keyof T]
      // Basic validation - check if required field is empty
      if (value === '' || value === null || value === undefined) {
        newErrors[key] = 'This field is required'
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [formData])

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault()
      }

      // Validate form
      if (!validateForm()) {
        return
      }

      setIsSubmitting(true)

      try {
        await onSubmit(formData)
        
        // Clear form from storage on successful submit
        try {
          storageObject.removeItem(storageKey)
        } catch (error) {
          console.error('Error clearing form from storage:', error)
        }

        setIsDirty(false)
        
        if (onSubmitSuccess) {
          onSubmitSuccess(formData)
        }
      } catch (error) {
        console.error('Form submission error:', error)
        
        if (onSubmitError) {
          onSubmitError(error)
        }
      } finally {
        setIsSubmitting(false)
      }
    },
    [formData, validateForm, onSubmit, storageKey, storageObject, onSubmitSuccess, onSubmitError]
  )

  /**
   * Clear form and storage
   */
  const clearForm = useCallback(() => {
    setFormData(initialValues)
    setErrors({})
    setIsDirty(false)
    
    try {
      storageObject.removeItem(storageKey)
    } catch (error) {
      console.error('Error clearing form from storage:', error)
    }
  }, [initialValues, storageKey, storageObject])

  /**
   * Reset form to initial values
   */
  const resetForm = useCallback(() => {
    setFormData(initialValues)
    setErrors({})
    setIsDirty(false)
  }, [initialValues])

  /**
   * Restore form from storage
   */
  const restoreForm = useCallback(() => {
    try {
      const savedData = storageObject.getItem(storageKey)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        setFormData({ ...initialValues, ...parsed })
      }
    } catch (error) {
      console.error('Error restoring form data:', error)
    }
  }, [storageKey, storageObject, initialValues])

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  /**
   * Warn user before leaving with unsaved changes
   */
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  return {
    formData,
    errors,
    isDirty,
    isSubmitting,
    handleChange,
    handleSubmit,
    setFormData,
    setFieldValue,
    setFieldError,
    clearForm,
    resetForm,
    restoreForm,
    validateField,
    validateForm,
  }
}

export default usePersistentForm
