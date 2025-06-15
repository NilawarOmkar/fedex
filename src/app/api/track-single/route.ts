import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const FEDEX_CLIENT_ID = 'l762c77e3f80e74239b64dc2ddc0e5b080';
const FEDEX_CLIENT_SECRET = '23feacc012f2444aba71623a20572b98';

const FEDEX_AUTH_URL = 'https://apis.fedex.com/oauth/token';
const FEDEX_TRACK_SINGLE_URL = 'https://apis.fedex.com/track/v1/trackingnumbers';

export async function POST(req: NextRequest) {
    try {
        const { trackingNumber } = await req.json();

        // Step 1: Get OAuth token
        const tokenRes = await fetch(FEDEX_AUTH_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: FEDEX_CLIENT_ID,
                client_secret: FEDEX_CLIENT_SECRET,
            }),
        });

        if (!tokenRes.ok) {
            throw new Error('Failed to fetch FedEx OAuth token');
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        // Step 2: Call FedEx single tracking API
        const trackRes = await fetch(FEDEX_TRACK_SINGLE_URL, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'x-customer-transaction-id': uuidv4(),
            },
            body: JSON.stringify({
                includeDetailedScans: true,
                trackingInfo: [
                    {
                        trackingNumberInfo: {
                            trackingNumber: trackingNumber,
                        },
                    },
                ],
            }),
        });

        if (!trackRes.ok) {
            throw new Error('Failed to fetch tracking data from FedEx API');
        }

        const trackData = await trackRes.json();
        return NextResponse.json(trackData);
    } catch (error: any) {
        console.error('FedEx Single Tracking Error:', error.message);
        return NextResponse.json({ error: 'Failed to fetch tracking data' }, { status: 500 });
    }
}
