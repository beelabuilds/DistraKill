type AuthCredentials = {
  email: string;
  password: string;
};

type RegisterCredentials = AuthCredentials & {
  name: string;
};

export type MockAuthUser = {
  name: string;
  email: string;
};

const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function createUser(name: string, email: string): MockAuthUser {
  return {
    name,
    email,
  };
}

export async function login(email: string, password: string) {
  const credentials: AuthCredentials = { email, password };
  await delay(900);

  return createUser(credentials.email.split('@')[0] || 'Student', credentials.email);
}

export async function register(name: string, email: string, password: string) {
  const credentials: RegisterCredentials = { name, email, password };
  await delay(1100);

  return createUser(credentials.name, credentials.email);
}

export async function requestPasswordReset(email: string) {
  await delay(1000);

  return {
    email,
    message: 'Reset instructions sent.',
  };
}

export async function logout() {
  await delay(300);
}
