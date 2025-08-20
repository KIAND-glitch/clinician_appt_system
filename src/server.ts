import 'dotenv/config';
import { app } from './app';

const port = Number(process.env.PORT || 3000);
const host = '0.0.0.0';

const server = app.listen(port, host, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

