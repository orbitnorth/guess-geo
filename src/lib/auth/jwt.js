import * as jose from 'jose'

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'guess-geo-nextjs-secret-key-for-jwt-jose-token-signature-32b'
const secretKey = new TextEncoder().encode(JWT_SECRET_STRING)
const ALGORITHM = 'HS256'

export async function signUserToken(user) {
  return await new jose.SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secretKey)
}

export async function verifyUserToken(token) {
  try {
    const { payload } = await jose.jwtVerify(token, secretKey)
    return payload
  } catch {
    return null
  }
}

export async function getAuthUser(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice(7).trim()
  return await verifyUserToken(token)
}
