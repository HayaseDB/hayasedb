import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  pixelBasedPreset,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface LoginNotificationEmailProps {
  appName?: string;
  userName: string;
  loginDetails: {
    time: string;
    device: string;
    browser: string;
    location: string;
    ipAddress: string;
  };
}

export const LoginNotificationEmail = ({
  appName = 'HayaseDB',
  userName = 'John Doe',
  loginDetails = {
    time: 'December 28, 2025 at 3:45 PM',
    device: 'Linux - Desktop',
    browser: 'Chrome 131',
    location: 'Berlin, Germany',
    ipAddress: '192.168.1.1',
  },
}: LoginNotificationEmailProps) => {
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
          <Preview>New Login to Your {appName} Account</Preview>
          <Container className="mx-auto my-[40px] max-w-[560px] p-[20px]">
            <Heading className="mx-0 my-[16px] p-0 text-[24px] font-semibold text-black">
              New Login Detected
            </Heading>

            <Text className="text-[15px] text-black leading-[24px]">
              Hi {userName},
            </Text>

            <Text className="text-[15px] text-black leading-[24px]">
              We detected a new login to your {appName} account.
            </Text>

            <Section className="my-[24px]">
              <Row>
                <Column>
                  <Text className="text-[#666666] text-[14px] leading-[20px] m-[8px_0]">
                    Time
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-black text-[14px] font-medium leading-[20px] m-[8px_0]">
                    {loginDetails.time}
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text className="text-[#666666] text-[14px] leading-[20px] m-[8px_0]">
                    Device
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-black text-[14px] font-medium leading-[20px] m-[8px_0]">
                    {loginDetails.device}
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text className="text-[#666666] text-[14px] leading-[20px] m-[8px_0]">
                    Browser
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-black text-[14px] font-medium leading-[20px] m-[8px_0]">
                    {loginDetails.browser}
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text className="text-[#666666] text-[14px] leading-[20px] m-[8px_0]">
                    Location
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-black text-[14px] font-medium leading-[20px] m-[8px_0]">
                    {loginDetails.location}
                  </Text>
                </Column>
              </Row>
              <Row>
                <Column>
                  <Text className="text-[#666666] text-[14px] leading-[20px] m-[8px_0]">
                    IP Address
                  </Text>
                </Column>
                <Column align="right">
                  <Text className="text-black text-[14px] font-medium leading-[20px] m-[8px_0]">
                    {loginDetails.ipAddress}
                  </Text>
                </Column>
              </Row>
            </Section>

            <Section className="rounded bg-[#fef2f2] border border-[#fecaca] border-solid p-[16px] my-[24px]">
              <Text className="text-[#dc2626] text-[14px] leading-[22px] m-0 font-medium">
                If this wasn't you
              </Text>
              <Text className="text-[#666666] text-[14px] leading-[22px] m-0 mt-[8px]">
                Please change your password immediately and review your account
                security.
              </Text>
            </Section>

            <Text className="text-[15px] text-black leading-[24px]">
              Best regards,
              <br />
              The {appName} Team
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

export default LoginNotificationEmail;
