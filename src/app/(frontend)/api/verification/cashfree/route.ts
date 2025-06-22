import { NextRequest, NextResponse } from 'next/server';
import { generateCashfreeSignature } from '@/lib/cashfree/security';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { User } from '@/payload-types';

const CASHFREE_API_URL = 'https://sandbox.cashfree.com/api/v2/verification'; // Using sandbox for testing

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config });
  
  let user: User | null = null;
  try {
    const authResult = await payload.auth({ headers: req.headers });
    if (!authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    user = authResult.user;
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { verification_id, id_number } = await req.json();

  if (!verification_id || !id_number) {
    return NextResponse.json({ error: 'Missing verification_id or id_number' }, { status: 400 });
  }

  const cashfreePayload = {
    verification_id,
    id_number,
  };

  try {
    const signature = generateCashfreeSignature(cashfreePayload);

    const response = await fetch(`${CASHFREE_API_URL}/${verification_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-03-01',
        'x-client-id': process.env.CASHFREE_CLIENT_ID || '',
        'x-client-secret': process.env.CASHFREE_CLIENT_SECRET || '',
        'x-cf-signature': signature,
      },
      body: JSON.stringify(cashfreePayload),
    });

    const data = await response.json();

    if (!response.ok) {
        // Even on failure, we might want to log the attempt
        await payload.update({
            collection: 'users',
            id: user.id,
            data: {
                verification: {
                    ...user.verification,
                    status: 'rejected',
                }
            }
        });
        return NextResponse.json({ error: 'Failed to verify with Cashfree', details: data }, { status: response.status });
    }
    
    // Determine the status and update payload
    const isPan = verification_id.includes('pan');
    const cashfreeStatus = data.status; // Assuming cashfree response has a 'status' field
    let olympiaStatus: 'verified' | 'pending' | 'rejected' = 'rejected';

    if (cashfreeStatus === 'VALID' || response.status === 200) {
        olympiaStatus = 'verified';
    } else if (cashfreeStatus === 'PENDING') {
        olympiaStatus = 'pending';
    }
    
    await payload.update({
        collection: 'users',
        id: user.id,
        data: {
            verification: {
                status: olympiaStatus,
                [isPan ? 'pan' : 'aadhaar']: id_number,
                verifiedData: data,
            }
        }
    });

    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('Cashfree verification error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
} 