import { useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Container,
  Link as HLink,
  Snackbar,
  TextField,
  Typography,
  Grid,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { GitHub } from "@mui/icons-material";
import MAlert from "src/components/Alert";
import themeConfig from "src/configs/themeConfig";
import { useRegister, RegisterRequest } from "../index";

// Constants
const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const VALIDATION_MESSAGES = {
  FULL_NAME_REQUIRED: "Full name is required",
  EMAIL_REQUIRED: "Email is required",
  EMAIL_INVALID: "Invalid email address",
  PASSWORD_REQUIRED: "Password is required",
  PASSWORD_MIN_LENGTH: "Password must be at least 8 characters",
  PASSWORD_MISMATCH: "Passwords do not match",
};

const DEFAULT_FORM_VALUES = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

// const SUPPORT_EMAIL = "support@example.com";

interface SignUpFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignUp() {
  const [open, setOpen] = useState<boolean>(false);
  const [alertType, setAlertType] = useState<"error" | "success">("success");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleCloseAlert = useCallback(() => setOpen(false), []);

  const handleRegisterSuccess = useCallback(() => {
    setAlertType("success");
    setOpen(true);
    controlForm.reset();
  }, []);

  const handleRegisterError = useCallback((error: any) => {
    setAlertType("error");
    setErrorMessage(
      error.response?.data?.detail || error.message || "Registration failed"
    );
    setOpen(true);
  }, []);

  const registerMutation = useRegister({
    onSuccess: handleRegisterSuccess,
    onError: handleRegisterError,
  });

  const controlForm = useForm<SignUpFormData>({
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const onSubmit = useCallback(
    (data: SignUpFormData) => {
      const [firstName, ...lastName] = data.fullName.split(" ");
      const registerData: RegisterRequest = {
        email: data.email,
        password: data.password,
        first_name: firstName,
        last_name: lastName.join(" "),
      };
      registerMutation.mutate({ data: registerData });
    },
    [registerMutation]
  );

  return (
    <>
      <Helmet>
        <title>Sign Up - {themeConfig.templateName}</title>
        <meta
          name="description"
          content={`Create a new account on ${themeConfig.templateName}`}
        />
        <meta
          name="keywords"
          content={`sign up, registration, create account, ${themeConfig.templateName}`}
        />
      </Helmet>
      <Container component="main" maxWidth={false} sx={{ height: "100vh" }}>
        <CssBaseline />
        <Backdrop
          sx={{ color: "#FFFFFF", zIndex: (theme) => theme.zIndex.drawer + 10 }}
          open={registerMutation.isPending}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
        <Snackbar
          anchorOrigin={{
            vertical: "top",
            horizontal: "center",
          }}
          open={open}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
        >
          <MAlert
            onClose={handleCloseAlert}
            severity={alertType}
            sx={{ width: "100%" }}
          >
            {alertType === "success" && (
              <Box>
                <Typography component="body" pt={1} bgcolor="transparent" color="#FFF">
                  Email Verification Sent!
                </Typography>
                <Typography component="body" pt={1} bgcolor="transparent" color="#FFF">
                  We've sent an email to your registered email address with a
                  link to verify your account. Please check your inbox and
                  click on the verification link to complete the registration
                  process.
                </Typography>
              </Box>
            )}
            {alertType === "error" && (
              <Box>
                <Typography component="body" pt={1} bgcolor="transparent" color="#FFF">
                  Error Sending Email Verification
                </Typography>
                <Typography
                  variant="body1"
                  component="body"
                  bgcolor="transparent"
                  pt={1}
                  color="#FFF"
                >
                  {errorMessage}
                </Typography>
              </Box>
            )}
          </MAlert>
        </Snackbar>
        <Grid container sx={{ height: "100%" }}>
          <Grid
            item
            xs={12}
            sm={6}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              p: 4,
            }}
          >
            <Typography component="h1" variant="h4" sx={{ mb: 2 }}>
              <strong>Automate Your Job Search.</strong>
            </Typography>
            <Typography variant="subtitle1">
              Spend less time applying and more time interviewing. Sign up to
              get started.
            </Typography>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              p: 4,
            }}
          >
            <Box
              sx={{
                width: "100%",
                maxWidth: 400,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <Typography component="h1" variant="h5">
                Create Your Free Account
              </Typography>
              <Typography variant="subtitle1">Let's get you started!</Typography>
              <Box
                component="form"
                noValidate
                onSubmit={controlForm.handleSubmit(onSubmit)}
                sx={{ mt: 3, width: "100%" }}
              >
                <Controller
                  name="fullName"
                  control={controlForm.control}
                  rules={{
                    required: {
                      value: true,
                      message: VALIDATION_MESSAGES.FULL_NAME_REQUIRED,
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      fullWidth
                      id="fullName"
                      label="Full Name"
                      autoFocus
                      sx={{ mb: 2 }}
                      error={!!controlForm.formState.errors.fullName}
                      helperText={
                        controlForm.formState.errors.fullName?.message
                      }
                    />
                  )}
                />
                <Controller
                  name="email"
                  control={controlForm.control}
                  rules={{
                    required: {
                      value: true,
                      message: VALIDATION_MESSAGES.EMAIL_REQUIRED,
                    },
                    pattern: {
                      value: EMAIL_PATTERN,
                      message: VALIDATION_MESSAGES.EMAIL_INVALID,
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      fullWidth
                      id="email"
                      label="Email Address"
                      autoComplete="email"
                      sx={{ mb: 2 }}
                      error={!!controlForm.formState.errors.email}
                      helperText={controlForm.formState.errors.email?.message}
                    />
                  )}
                />
                <Controller
                  name="password"
                  control={controlForm.control}
                  rules={{
                    required: {
                      value: true,
                      message: VALIDATION_MESSAGES.PASSWORD_REQUIRED,
                    },
                    minLength: {
                      value: 8,
                      message: VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH,
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type="password"
                      id="password"
                      autoComplete="new-password"
                      sx={{ mb: 2 }}
                      error={!!controlForm.formState.errors.password}
                      helperText={
                        controlForm.formState.errors.password?.message
                      }
                    />
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={controlForm.control}
                  rules={{
                    required: true,
                    validate: (value) => {
                      const password = controlForm.getValues("password");
                      return (
                        value === password ||
                        VALIDATION_MESSAGES.PASSWORD_MISMATCH
                      );
                    },
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Confirm Password"
                      type="password"
                      id="confirmPassword"
                      autoComplete="new-password"
                      sx={{ mb: 2 }}
                      error={!!controlForm.formState.errors.confirmPassword}
                      helperText={
                        controlForm.formState.errors.confirmPassword?.message
                      }
                    />
                  )}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GitHub />}
                  sx={{ mb: 2 }}
                >
                  Sign Up with Google
                </Button>
                <Typography variant="body2" color="text.secondary" align="center">
                  By creating an account, you agree to our{" "}
                  <HLink component={Link} to="/terms" variant="body2">
                    Terms of Service
                  </HLink>{" "}
                  and{" "}
                  <HLink component={Link} to="/privacy" variant="body2">
                    Privacy Policy
                  </HLink>
                  .
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}