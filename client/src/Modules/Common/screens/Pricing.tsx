/**
 * Pricing Page
 * 
 * Displays pricing plans and frequently asked questions
 * for God Lion Seeker Optimizer
 */

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButtonGroup,
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  ExpandMore,
  WorkspacePremium,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import themeConfig from 'src/configs/themeConfig';

// Pricing plan interface
interface PricingPlan {
  name: string;
  price: number;
  priceAnnual: number;
  description?: string;
  features: string[];
  buttonText: string;
  buttonVariant: 'contained' | 'outlined';
  featured?: boolean;
}

const pricingPlans: PricingPlan[] = [
  {
    name: 'Starter',
    price: 29,
    priceAnnual: 23,
    features: [
      '10 AI Searches/day',
      'Basic Profile Optimization',
      'Standard Job Alerts',
      'Email Support',
    ],
    buttonText: 'Get Started',
    buttonVariant: 'outlined',
  },
  {
    name: 'Pro',
    price: 59,
    priceAnnual: 47,
    features: [
      'Unlimited AI Searches',
      'Advanced Resume Analysis',
      'Interview Prep Tools',
      'Priority Support',
    ],
    buttonText: 'Get Started',
    buttonVariant: 'contained',
    featured: true,
  },
  {
    name: 'Recruiter',
    price: 199,
    priceAnnual: 159,
    features: [
      'Multi-user Access',
      'Candidate Sourcing Tools',
      'Advanced Analytics',
      'Dedicated Account Manager',
    ],
    buttonText: 'Contact Sales',
    buttonVariant: 'outlined',
  },
];

// FAQ interface
interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: "What's the difference between the plans?",
    answer:
      'The Starter plan is perfect for casual job seekers. The Pro plan offers unlimited searches and advanced tools for active seekers. The Recruiter plan is designed for teams and HR professionals with multi-user access and sourcing tools.',
  },
  {
    question: 'Can I cancel my subscription at any time?',
    answer:
      'Yes, you can cancel your subscription anytime from your account settings. Your plan will remain active until the end of the current billing cycle, and you will not be charged again.',
  },
  {
    question: 'What happens if I switch to the annual plan?',
    answer:
      "When you switch to an annual plan, you'll be billed for the full year at a discounted rate. We will prorate any remaining balance from your current monthly plan and apply it as a credit to your new annual subscription.",
  },
  {
    question: 'How does the AI technology work?',
    answer:
      'Our AI analyzes your resume, skills, and career goals to match you with the most relevant job openings from millions of listings. It also provides personalized recommendations to optimize your profile and prepare for interviews.',
  },
];

export const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const handleBillingChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: 'monthly' | 'annual' | null
  ) => {
    if (newValue !== null) {
      setBillingCycle(newValue);
    }
  };

  const getPrice = (plan: PricingPlan) => {
    return billingCycle === 'monthly' ? plan.price : plan.priceAnnual;
  };

  return (
    <>
      <Helmet>
        <title>Pricing - {themeConfig.templateName}</title>
        <meta
          name="description"
          content={`View pricing plans for ${themeConfig.templateName} and unlock your career potential`}
        />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Page Heading */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 900,
              fontSize: { xs: '2rem', md: '3rem' },
              letterSpacing: '-0.03em',
            }}
          >
            Choose the Plan That's Right for You
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ fontSize: { xs: '1rem', md: '1.125rem' } }}
          >
            Unlock your career potential with the power of AI.
          </Typography>
        </Box>

        {/* Billing Toggle */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
          <ToggleButtonGroup
            value={billingCycle}
            exclusive
            onChange={handleBillingChange}
            aria-label="billing cycle"
            sx={{
              bgcolor: 'action.hover',
              borderRadius: 10,
              p: 0.5,
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: 10,
                px: 3,
                py: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                '&.Mui-selected': {
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  '&:hover': {
                    bgcolor: 'background.paper',
                  },
                },
              },
            }}
          >
            <ToggleButton value="monthly" aria-label="monthly billing">
              Monthly
            </ToggleButton>
            <ToggleButton value="annual" aria-label="annual billing">
              Annual
              <Chip
                label="Save 20%"
                size="small"
                color="primary"
                sx={{ ml: 1, fontWeight: 700, fontSize: '0.625rem' }}
              />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Pricing Cards */}
        <Grid container spacing={3} sx={{ mb: 10 }}>
          {pricingPlans.map((plan, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card
                elevation={plan.featured ? 8 : 1}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: plan.featured ? 2 : 1,
                  borderColor: plan.featured ? 'primary.main' : 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: plan.featured ? 12 : 4,
                  },
                }}
              >
                {plan.featured && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <Chip
                      label="Most Popular"
                      color="primary"
                      size="small"
                      sx={{
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        fontSize: '0.625rem',
                        letterSpacing: '0.1em',
                      }}
                    />
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1, pt: plan.featured ? 4 : 3 }}>
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    sx={{ fontWeight: 700 }}
                  >
                    {plan.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 3 }}>
                    <Typography
                      variant="h3"
                      component="span"
                      sx={{
                        fontWeight: 900,
                        letterSpacing: '-0.03em',
                      }}
                    >
                      ${getPrice(plan)}
                    </Typography>
                    <Typography
                      variant="body1"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      /month
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <List disablePadding>
                    {plan.features.map((feature, i) => (
                      <ListItem key={i} disableGutters sx={{ py: 0.75 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircle color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontSize: '0.875rem',
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions sx={{ p: 3, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={plan.buttonVariant}
                    size="large"
                    sx={{
                      py: 1.5,
                      fontWeight: 700,
                      textTransform: 'none',
                    }}
                  >
                    {plan.buttonText}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* FAQ Section */}
        <Box sx={{ maxWidth: 900, mx: 'auto' }}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.75rem', md: '2.125rem' },
              }}
            >
              Frequently Asked Questions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Can't find the answer you're looking for? Reach out to our customer
              support team.
            </Typography>
          </Box>

          <Stack spacing={2}>
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                defaultExpanded={index === 0}
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:before': {
                    display: 'none',
                  },
                  '&.Mui-expanded': {
                    margin: 0,
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    px: 3,
                    py: 2,
                    '& .MuiAccordionSummary-content': {
                      my: 1,
                    },
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {faq.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 3, pt: 0 }}>
                  <Typography variant="body2" color="text.secondary">
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Box>
      </Container>
    </>
  );
};

export default Pricing;
