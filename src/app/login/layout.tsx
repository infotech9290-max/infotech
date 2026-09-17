import { Metadata } from 'next';
import { supabaseServer } from '@/utils/supabaseServer';

export async function generateMetadata(): Promise<Metadata> {
  let websiteName = 'SATYAM';
  try {
    const { data } = await supabaseServer
      .from('settings')
      .select('setting_value')
      .eq('setting_key', 'brand')
      .single();
    if (data?.setting_value?.websiteName) {
      websiteName = data.setting_value.websiteName;
    }
  } catch (error) {
    // fallback
  }

  return {
    title: `Login | ${websiteName} Admin Portal`,
    description: 'Secure login for institute admission management staff.',
    robots: { index: false, follow: false }
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
