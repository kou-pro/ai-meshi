'use client'

import { Container, Box, Typography, Button } from '@mui/material'

export default function Page() {
  return (
    <Container maxWidth="sm">
      <Box mt={8} textAlign="center">
        <Typography variant="h4">Ai-meshi</Typography>
        <Button
          variant="contained"
          sx={{
            p: 6,
            ml: 3,
            mt: 4,
            textTransform: 'none',
            color: { xs: 'white', md: 'red' },
          }}
        >
          生成する
        </Button>
      </Box>
    </Container>
  )
}
