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

interface PasswordResetEmailProps {
  appName?: string;
  userName?: string;
  resetUrl?: string;
  expiresIn?: string;
}

export const PasswordResetEmail = ({
  appName = 'HayaseDB',
  userName = 'John Doe',
  resetUrl = 'http://localhost:5173/auth/reset-password?token=abc123',
  expiresIn = '1 hour',
}: PasswordResetEmailProps) => {
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
          <Preview>Reset your password for {appName}</Preview>
          <Container className="mx-auto my-[40px] max-w-[560px] p-[20px]">
            <Heading className="mx-0 my-[16px] p-0 text-[24px] font-semibold text-black">
              Reset Your Password
            </Heading>

            <Text className="text-[15px] text-black leading-[24px]">
              Hi {userName},
            </Text>

            <Text className="text-[15px] text-black leading-[24px]">
              We received a request to reset your password for your {appName}{' '}
              account. If you made this request, click the button below to set a
              new password:
            </Text>

            <Button
              className="rounded bg-[#000000] px-5 py-3 text-center font-medium text-[15px] text-white no-underline"
              href={resetUrl}
            >
              Reset Password
            </Button>

            <Text className="text-[#666666] text-[14px] leading-[24px] mt-[24px]">
              This link will expire in {expiresIn}. If you didn't request a
              password reset, you can safely ignore this email. Your password
              will remain unchanged.
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

export default PasswordResetEmail;
