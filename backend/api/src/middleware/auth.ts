import { NextFunction, Request, RequestHandler, Response } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../config/firebase';

export interface AuthedRequest extends Request {
  user?: DecodedIdToken & { role?: string };
}

const BEARER_PREFIX = 'Bearer ';
const COORDINATOR_ROLE = 'coordinator';

export const verifyFirebaseAuth: RequestHandler = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization as string | undefined;

  if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
    res.status(401).json({ error: 'Missing or invalid Authorization header.' });
    return;
  }

  try {
    const idToken = authHeader.slice(BEARER_PREFIX.length);
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    // Provide server side visibility into repeated auth failures so we can debug invalid tokens quickly.
    // eslint-disable-next-line no-console
    console.error('Firebase auth verification failed:', error);
    res.status(401).json({ error: 'Unauthorized', details: error instanceof Error ? error.message : error });
  }
};

export const requireCoordinator: RequestHandler = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const role = req.user?.role;

  if (role !== COORDINATOR_ROLE) {
    res.status(403).json({ error: 'Forbidden', message: 'Coordinator role required.' });
    return;
  }

  next();
};
