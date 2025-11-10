import React from 'react'
import { Box, Container, Typography, Accordion, AccordionSummary, AccordionDetails, alpha, useTheme } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

interface FAQ {
  question: string
  answer: string
}

const faqs: FAQ[] = [
  {
    question: 'How does the AI job matching work?',
    answer:
      'Our AI analyzes your resume, skills, experience, and preferences to match you with relevant job opportunities. It uses natural language processing and machine learning algorithms to understand job descriptions and calculate compatibility scores based on multiple factors including skills match, experience level, location preferences, and salary expectations.',
  },
  {
    question: 'Is my data secure and private?',
    answer:
      'Absolutely. We take data security very seriously. All your personal information and documents are encrypted both in transit and at rest. We comply with GDPR, CCPA, and other data protection regulations. We never share your data with third parties without your explicit consent, and you can delete your data at any time.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, you can cancel your subscription at any time with no penalties or hidden fees. Your access will continue until the end of your current billing period. If you cancel during the free trial, you won\'t be charged at all.',
  },
  {
    question: 'What makes this different from other job search platforms?',
    answer:
      'Unlike traditional job boards, we use advanced AI to actively hunt for opportunities that match your profile. We don\'t just show you listings - we analyze them, optimize your applications, track your progress, and provide actionable insights. Our automation engine can handle repetitive tasks, allowing you to focus on what matters: preparing for interviews and landing your dream job.',
  },
  {
    question: 'Do you support international job searches?',
    answer:
      'Yes! Our platform aggregates job listings from multiple countries and supports various languages. You can set your location preferences and search for remote positions worldwide. We also provide insights into visa requirements and relocation support for international opportunities.',
  },
  {
    question: 'How accurate is the resume optimization feature?',
    answer:
      'Our resume optimization feature uses the same AI technology that recruiters and ATS (Applicant Tracking Systems) use to screen candidates. It has been trained on millions of successful resumes and job descriptions, achieving over 90% accuracy in identifying areas for improvement. Users typically see a 40% increase in interview callbacks after optimization.',
  },
]

const FAQSection: React.FC = () => {
  const theme = useTheme()
  const [expanded, setExpanded] = React.useState<string | false>(false)

  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  return (
    <Box
      sx={{
        bgcolor: 'background.default',
        py: { xs: 8, md: 12 },
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
              fontWeight: 800,
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              mb: 2,
            }}
          >
            Frequently Asked Questions
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', md: '1.125rem' },
              color: 'text.secondary',
              lineHeight: 1.7,
            }}
          >
            Everything you need to know about our platform
          </Typography>
        </Box>

        {/* FAQ Accordions */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              expanded={expanded === `panel${index}`}
              onChange={handleChange(`panel${index}`)}
              elevation={0}
              sx={{
                bgcolor: 'background.paper',
                border: 1,
                borderColor: expanded === `panel${index}` ? 'primary.main' : 'divider',
                borderRadius: '12px !important',
                '&:before': {
                  display: 'none',
                },
                '&.Mui-expanded': {
                  margin: 0,
                  boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`,
                },
                transition: 'all 0.3s ease',
              }}
            >
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon
                    sx={{
                      color: expanded === `panel${index}` ? 'primary.main' : 'text.secondary',
                      transition: 'all 0.3s ease',
                    }}
                  />
                }
                sx={{
                  minHeight: 64,
                  px: 3,
                  '&.Mui-expanded': {
                    minHeight: 64,
                  },
                  '& .MuiAccordionSummary-content': {
                    my: 2,
                    '&.Mui-expanded': {
                      my: 2,
                    },
                  },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: expanded === `panel${index}` ? 'primary.main' : 'text.primary',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  px: 3,
                  pb: 3,
                  pt: 0,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.7,
                  }}
                >
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>

        {/* Bottom CTA */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 8,
            p: 4,
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            border: 1,
            borderColor: alpha(theme.palette.primary.main, 0.2),
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Still have questions?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Our support team is here to help you
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Contact Support →
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default FAQSection
