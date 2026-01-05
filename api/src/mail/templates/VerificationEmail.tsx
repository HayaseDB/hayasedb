import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  pixelBasedPreset,
  Preview,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  appName?: string;
  userName?: string;
  verificationUrl?: string;
  expiresIn?: string;
}

export const VerificationEmail = ({
  appName = 'HayaseDB',
  userName = 'John Doe',
  verificationUrl = 'http://localhost:5173/verify-email?token=abc123',
  expiresIn = '24 hours',
}: VerificationEmailProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
        }}
      >
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Preview>Verify your email address for {appName}</Preview>
          <Container className="mx-auto my-[40px] max-w-[560px] p-[20px]">
            <Heading className="mx-0 my-[16px] p-0 text-[24px] font-semibold text-black">
              Verify Your Email Address
            </Heading>

            <Text className="text-[15px] text-black leading-[24px]">
              Hi {userName},
            </Text>

            <Text className="text-[15px] text-black leading-[24px]">
              Welcome to {appName}! Before you can get started, we need to
              verify your email address.
            </Text>

            <Text className="text-[15px] text-black leading-[24px]">
              Please click the button below to confirm your account:
            </Text>

            <Button
              className="rounded bg-[#000000] px-5 py-3 text-center font-medium text-[15px] text-white no-underline"
              href={verificationUrl}
            >
              Verify Email
            </Button>

            <Text className="text-[#666666] text-[14px] leading-[24px] mt-[24px]">
              This link will expire in {expiresIn}. If you didn't create an
              account with {appName}, you can safely ignore this email.
            </Text>

            <Hr className="mx-0 my-[32px] w-full border border-[#e5e5e5] border-solid" />

            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              This is an automated message. Please do not reply to this email.
            </Text>

            <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
              © {currentYear} {appName}. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default VerificationEmail;
