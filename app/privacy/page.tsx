import MobileShell from "@/components/layout/MobileShell";
import AppHeader from "@/components/layout/AppHeader";
import BottomNav from "@/components/layout/BottomNav";

export default function PrivacyPage() {
  return (
    <MobileShell>
      <AppHeader title="개인정보처리방침" showBack backHref="/settings" />
      <main className="flex-1 overflow-y-auto bg-[#FAFCFA] px-4 py-5 pb-24">
        <section className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
          <h1 className="text-xl font-black text-[#1F2937]">카카오 로그인 연동 안내</h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            내일의건강은 사용자가 선택한 경우 카카오 소셜 로그인을 통해 회원 식별과 앱 이용을
            지원합니다. 카카오 로그인 사용자의 비밀번호는 내일의건강 데이터베이스에 저장하지 않습니다.
          </p>

          <div className="mt-5 space-y-4 text-sm leading-relaxed text-gray-600">
            <div>
              <h2 className="font-extrabold text-[#1F5A3A]">수집 항목</h2>
              <p className="mt-1">
                카카오 provider 사용자 ID, 이메일, 닉네임, 프로필 이미지 URL, 가입 및 로그인 연동
                시각을 수집할 수 있습니다.
              </p>
            </div>
            <div>
              <h2 className="font-extrabold text-[#1F5A3A]">이용 목적</h2>
              <p className="mt-1">
                회원 식별, 로그인 유지, 습관 기록, 건강 점수, 코치 설정 등 사용자의 앱 데이터를
                기존 계정과 연결하기 위해 사용합니다.
              </p>
            </div>
            <div>
              <h2 className="font-extrabold text-[#1F5A3A]">보관 및 삭제</h2>
              <p className="mt-1">
                사용자가 서비스 이용을 중단하거나 계정 삭제를 요청하면 관련 개인정보는 관계 법령에
                따라 필요한 범위를 제외하고 삭제됩니다.
              </p>
            </div>
          </div>
        </section>
      </main>
      <BottomNav />
    </MobileShell>
  );
}

