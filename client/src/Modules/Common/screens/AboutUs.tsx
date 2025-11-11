import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Link,
  IconButton,
} from '@mui/material';
import {
  WorkspacePremium,
  LinkedIn,
  Twitter,
  GitHub,
} from '@mui/icons-material';
import { Helmet } from 'react-helmet-async';
import themeConfig from 'src/configs/themeConfig';

// Team member interface
interface TeamMember {
  name: string;
  role: string;
  image: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Alex Johnson',
    role: 'Founder & CEO',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAppVwobnnN8Gq_Jz6Pnx7KVCMRzlJko5yC2RYUsX00ckoHrrKbgtyGZ31nHujACIOmcDiGwUt0nyT97tIODmyoxot5S5df6eJD7BUgyWF87LSTAFprpB7HYjUz57vyI4fLDfGkt1Tbon8f1MUXx1sg4zQt19ztyOfx0UZzvZ_GsxsWM7GOiTXkKs8HjvayqSMRy1vi2xyjG8i_GrqwbL8W3eytroBZOSh6WawzOAAVrN0IA9uYdt9CwFkJZuZS8uRR0EjKDD43uPk',
  },
  {
    name: 'Brenda Chen',
    role: 'Lead AI Engineer',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBo_u3K7kR7_AcSNAj-hncFMN--f75L45Uecxq0j7mcGmdtrOZAWPhd_8ArzGvsy3PY8qgehnzvpf8Sb1Cf_f2gwc9gA5zi9dfwwLLwaS_cGWrF1pKVNOfim7gdcWXHUTbtEn4jbFdoA3GdD5nknmSPh87O3b1ZHcdvBg9xuM1JQijfreRy2fv766-ARTD5hY3PIEObp2Djoi8EznDLZGFXAzgWVJ5XUf2wunXIWe3I5bSnCkAuVREZYPKcMSp-g51iOsGtdNNnp8E',
  },
  {
    name: 'Carlos Rodriguez',
    role: 'Head of Product',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDHHqBL4a5BVjPuhIgzaX7NotBHDwxZHoLugy4_G-rCfG5IpFjJKmuLlU4W4nCIpQHARgbBc_Xkt352syCTuR_JGhxylYHt51bU8VYVDLv0Bt9P4gyW6TcmiFKRm4qlMyFQfYSBEilHuR_zOi-0wG1whFyq9Li9iJ53r5-rVpAVhvNEZgpbskpB7wvDkxIlr1GntmEw0mm2vR-udrfE0iMpgJCT10YFs6T_zgKKmPOw1kawIwcClFSMIXawB0I8XjMQr2MvcdEUVig',
  },
  {
    name: 'Diana Smith',
    role: 'Lead UX Designer',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC5nCOjaQVzX7FltACWRqXpidgIU9UYRQ1v5eFSNWP6wI5XmsELSoArTEtaYTAhlUh5k-s8ajkX9Tm7JmUIUCWonNz3A_9n4CpuKC8cIpMdMYSJgRRn3gTV_zk0IcNT2BaCUo_DZRxnXDjpWqh_kXG3Ms73I784iL1J1mQ-h6MJpW6vJshXETiZGM-4ablF6GFTa9xupw91Lg3yM0lNXeI_mQGIarlhAWOZ5WNpez5j7QQJ37muH1gLI3q1DfnTATZC1eAufjF6Nig',
  },
];

export const AboutUs: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>About Us - {themeConfig.templateName}</title>
        <meta
          name="description"
          content={`Learn about ${themeConfig.templateName} and our mission to revolutionize job search with AI`}
        />
      </Helmet>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 8, md: 12 },
          }}
        >
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              fontSize: { xs: '2rem', md: '3rem' },
              letterSpacing: '-0.02em',
            }}
          >
            The Future of Career Optimization.
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: 800,
              mx: 'auto',
              fontSize: { xs: '1rem', md: '1.125rem' },
              lineHeight: 1.6,
            }}
          >
            We're revolutionizing the job search experience with the power of AI,
            connecting talented individuals with their dream careers.
          </Typography>
        </Box>

        {/* Mission Section */}
        <Box sx={{ py: { xs: 6, md: 10 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  width: '100%',
                  paddingTop: { xs: '100%', md: '75%' },
                  position: 'relative',
                  borderRadius: 2,
                  overflow: 'hidden',
                  backgroundImage:
                    'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCCsf7MqQ9nRNplU21PokU_Vmb1NhFdelfxf_wZutG-Up85ymc_zBXcd8RL9vFYTcFEbzZuoEo7Zdvg3yBl19CMjZRdFTxxLrVrcYoS96njw8BE7DPTmCqwus9HVPpU6gv1BiC9JtLppNbsC-Gtm9JbhMgiaLrjnH-b6dmD5oGyAeFkFs4tb3pZb4SBcq1y_nC8W_KDXsmhpGlVMTEfohNjv6W8H-c_EteqT-LT-U_cdTcHyRxK7X_-S5Gk2u2-3m-Jx9R-o6w1Q0Y")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Typography
                  variant="h3"
                  component="h2"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1.75rem', md: '2.125rem' },
                    letterSpacing: '-0.02em',
                  }}
                >
                  Our Mission
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.8 }}
                >
                  Our mission is to empower every job seeker with personalized,
                  intelligent tools that uncover the best career opportunities. We
                  believe in a future where finding a fulfilling job is not a
                  challenge, but an inspiring journey of self-discovery and growth.
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ lineHeight: 1.8 }}
                >
                  By leveraging cutting-edge artificial intelligence, we analyze your
                  unique skills and aspirations to match you with roles that don't
                  just pay the bills, but also ignite your passion and drive your
                  professional development forward.
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Box>

        {/* Team Section */}
        <Box sx={{ py: { xs: 6, md: 10 } }}>
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              component="h2"
              gutterBottom
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1.75rem', md: '2.125rem' },
                letterSpacing: '-0.02em',
              }}
            >
              The Innovators Behind the Platform
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ maxWidth: 800, mx: 'auto' }}
            >
              We are a passionate team of engineers, designers, and career
              strategists dedicated to building a smarter way to find work.
            </Typography>
          </Box>

          {/* Team Grid */}
          <Grid container spacing={3}>
            {teamMembers.map((member, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  elevation={0}
                  sx={{
                    textAlign: 'center',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    image={member.image}
                    alt={member.name}
                    sx={{
                      aspectRatio: '1',
                      objectFit: 'cover',
                      borderRadius: 3,
                      maxWidth: 200,
                      mx: 'auto',
                      boxShadow: 3,
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant="h6"
                      component="div"
                      sx={{ fontWeight: 700 }}
                    >
                      {member.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{ fontWeight: 500 }}
                    >
                      {member.role}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </>
  );
};

export default AboutUs;
