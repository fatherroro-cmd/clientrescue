/* =============================================================================
   ClientRescue — Awkward Client Message & Invoice Follow-Up Generator
   -----------------------------------------------------------------------------
   Zero dependencies. Zero network calls. Everything runs in the browser.
   Works from a local file, a USB stick, or GitHub Pages.

   1. UI strings (EN / KO)
   2. Scenarios + 30 copy templates (5 scenarios x 3 tones x 2 languages)
   3. Template engine (segments, optional fields, cleanup)
   4. DOM wiring — skipped when there is no document, so tests can call
      CR.generate() directly with no browser.

   Template syntax
     {client} {project} {amount} {days} {date} {sender}  -> filled, or defaulted
     "plain string"                                      -> always shown
     { if: 'days', text: '...' }                         -> shown only if filled
     { if: 'date', text: '...', alt: '...' }             -> else the alt sentence
     '(1,200)'  with an empty amount becomes  ''         -> tidy() drops empty
                                                            brackets, double
                                                            spaces and ' .'
   ========================================================================== */
var CR = (function () {
  'use strict';

  /* ------------------------------------------------------------- 1. UI ----- */

  var UI = {
    en: {
      docTitle: 'ClientRescue — Awkward Client Message & Invoice Follow-Up Generator',
      brandTag: 'Free · no sign-up · runs offline',
      heroTitle: 'Say the awkward thing without losing the client.',
      heroSub: 'Pick the mess, pick the tone, copy a message a real person would send. 30 templates in English and Korean. Nothing is uploaded anywhere.',
      step1: 'Pick the mess',
      step2: 'Pick the tone',
      step3: 'Add details',
      step3opt: 'optional — the message works without them',
      headerNote: 'Free, private, and yours to keep',
      loadExample: 'Load example',
      clear: 'Clear',
      yourMessage: 'Your message',
      subjectLabel: 'Subject',
      bodyLabel: 'Message',
      copySubject: 'Copy subject',
      copyBody: 'Copy message',
      openMail: 'Open in email',
      copied: 'Copied',
      copyFail: 'Press Ctrl+C to copy',
      exampleLoaded: 'Example filled in',
      never: 'Never say this',
      chars: 'characters',
      words: 'words',
      ctaKicker: 'The full playbook',
      ctaTitle: '30 copy-paste scripts, the follow-up cadence, and a one-page emergency sheet.',
      ctaText: 'This free tool covers the five situations you hit most often. The playbook covers all thirty — mild to severe, day 1 to day 30 — plus the exact wording that keeps a client from walking out.',
      ctaButton: 'Get The Awkward Client Rescue Playbook',
      ctaNote: '$0+ on Gumroad — pay what you want, suggested $7 · PDF · instant download',
      footerLeft: 'No accounts, no cookies, no analytics. Everything stays in this tab.',
      footerRight: 'Built by one person with AI help. Share it with someone who needs it.',
      fieldLabels: {
        client: 'Client name', project: 'Project or service', amount: 'Amount',
        days: 'Days', date: 'Date', sender: 'Your name'
      },
      placeholders: {
        client: 'Sarah', project: 'the website redesign', amount: '1,200',
        days: '5', date: 'Fri 5 Dec', sender: 'Jordan'
      },
      toneNames: { calm: 'Calm & warm', firm: 'Firm & professional', short: 'Short & direct' },
      toneNotes: { calm: 'Keeps the relationship', firm: 'Holds the line', short: 'Three lines, from your phone' }
    },
    ko: {
      docTitle: 'ClientRescue — 곤란한 클라이언트 메시지·미수금 독촉 문장 생성기',
      brandTag: '무료 · 가입 없음 · 오프라인 실행',
      heroTitle: '관계는 지키고, 할 말은 하는 문장.',
      heroSub: '상황을 고르고, 말투를 고르고, 그대로 복사하세요. 실제로 보낼 수 있는 문장 30개, 한국어와 영어. 어디에도 전송되지 않습니다.',
      step1: '어떤 상황인가요',
      step2: '어떤 말투로 보낼까요',
      step3: '세부 정보',
      step3opt: '선택 사항 — 비워도 문장은 완성됩니다',
      headerNote: '무료, 비공개, 그대로 쓰세요',
      loadExample: '예시 채우기',
      clear: '지우기',
      yourMessage: '보낼 문장',
      subjectLabel: '제목',
      bodyLabel: '본문',
      copySubject: '제목 복사',
      copyBody: '본문 복사',
      openMail: '메일로 열기',
      copied: '복사됨',
      copyFail: 'Ctrl+C로 복사해 주세요',
      exampleLoaded: '예시를 채웠습니다',
      never: '이 말은 하지 마세요',
      chars: '자',
      words: '단어',
      ctaKicker: '전체 플레이북',
      ctaTitle: '복사해서 쓰는 문장 30개, 독촉 주기 표, 한 장짜리 비상 카드까지.',
      ctaText: '무료 도구는 가장 자주 만나는 5가지 상황만 다룹니다. 플레이북은 30가지를 다룹니다 — 가벼운 안내부터 최후 통보까지, 1일차부터 30일차까지, 그리고 클라이언트가 떠나지 않게 하는 정확한 표현까지.',
      ctaButton: 'The Awkward Client Rescue Playbook 받기',
      ctaNote: 'Gumroad에서 $0+ — 원하는 만큼 결제, 권장 $7 · PDF · 즉시 다운로드',
      footerLeft: '계정도, 쿠키도, 분석 도구도 없습니다. 모든 계산은 이 탭 안에서 끝납니다.',
      footerRight: '한 사람이 AI의 도움을 받아 만들었습니다. 필요한 사람에게 알려주세요.',
      fieldLabels: {
        client: '고객 이름', project: '프로젝트·서비스', amount: '금액',
        days: '일수', date: '날짜', sender: '보내는 사람'
      },
      placeholders: {
        client: '김민지', project: '브랜드 홈페이지', amount: '120만원',
        days: '5', date: '12월 5일 금요일', sender: '이준호'
      },
      toneNames: { calm: '차분하고 다정하게', firm: '단호하고 정중하게', short: '짧고 명확하게' },
      toneNotes: { calm: '관계를 지키고 싶을 때', firm: '선을 분명히 그을 때', short: '폰에서 세 줄로' }
    }
  };

  /* ------------------------------------------- 2. Scenarios and templates --- */

  var TONES = ['calm', 'firm', 'short'];

  var SCENARIOS = [
    /* ------------------------------------------------------------ 1 ------- */
    {
      id: 'deadline',
      svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.2v5.2l3.4 2"/></svg>',
      fields: ['client', 'project', 'days', 'date'],
      label: {
        en: { name: 'Missed a deadline', blurb: 'You are late and need a new date they believe.', days: 'Days late', date: 'New date you can commit to' },
        ko: { name: '납기 지연', blurb: '늦어졌고, 믿을 수 있는 새 날짜를 줘야 할 때.', days: '지연 일수', date: '약속할 새 날짜' }
      },
      avoid: {
        en: 'Never send “sorry, it is delayed” with no date in it. An apology without a date reads as “I have no idea”, and that is what makes clients leave.',
        ko: '“죄송합니다, 조금 늦어질 것 같습니다”만 보내지 마세요. 날짜 없는 사과는 “나도 모르겠다”로 읽히고, 클라이언트가 떠나는 이유가 여기서 생깁니다.'
      },
      tpl: {
        en: {
          calm: {
            subject: ['Quick update on {project} — new timeline'],
            body: [
              'Hi {client},',
              'I would rather tell you this now than have it land on you on delivery day: {project} is going to finish later than we planned.',
              { if: 'days', text: 'Realistically I am {days} days behind the date we agreed on.' },
              'What happened is on me: [one honest sentence — the real reason]. What I have already changed: [the fix — reordered the schedule, cleared two days, brought in help]. The date I can now commit to is {date}.',
              'Nothing changes on your side: the scope stays exactly as agreed, and the extra time comes out of my week, not your budget.',
              { if: 'date', text: 'If {date} creates a problem for you, reply and I will tell you what is possible. I can also send a partial version before then so you are not sitting blocked.', alt: 'If the timing creates a problem for you, reply and I will tell you what is possible. I can also send a partial version earlier so you are not sitting blocked.' },
              'Sorry for the shift, and thank you for the patience.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          firm: {
            subject: ['{project} — revised delivery date', { if: 'date', text: '({date})' }],
            body: [
              'Hi {client},',
              'This is a delivery update, not an apology note: {project} will be delivered on {date}, not on the original date. I am telling you now so you can plan around it instead of discovering it.',
              { if: 'days', text: 'That is {days} days later than we agreed.' },
              'The cause was on my side: [one sentence]. I am not going to dress it up.',
              'What is covered: the full agreed scope, at the agreed price, with no change to what you receive. What is not covered: anything new requested from today, because that moves the date again — I will confirm with you before starting any of it.',
              { if: 'date', text: 'If {date} does not work, tell me by [day] and we will agree a new date in writing. Either way you will have the finished work by {date}.', alt: 'If that timeline does not work, tell me by [day] and we will agree a new date in writing. Either way you will have the finished work by the new date.' },
              { if: 'sender', text: '{sender}' }
            ]
          },
          short: {
            join: ' ',
            subject: ['{project}: new delivery date', { if: 'date', text: '— {date}' }],
            body: [
              'Hi {client} — {project} is slipping to {date}. My fault, not yours.',
              { if: 'days', text: 'That is {days} days late.' },
              'Scope and price unchanged. Full delivery on {date}, or a partial version before that if you need something to review. Tell me now if the date is a problem.',
              { if: 'sender', text: '{sender}' }
            ]
          }
        },
        ko: {
          calm: {
            subject: ['{project} 일정 관련해 먼저 말씀드립니다'],
            body: [
              '안녕하세요, {client}님.',
              '{project} 건은 약속드린 날짜보다 늦어질 것 같습니다. 완성된 날 갑자기 알게 되시는 것보다 지금 미리 말씀드리는 게 맞다고 생각했습니다.',
              { if: 'days', text: '지금 기준으로는 약 {days}일 정도 늦어질 것으로 보입니다.' },
              '원인은 제 쪽에 있습니다. [한 줄로 솔직하게 — 실제 이유]. 지금은 [보완 조치 — 일정 재배치, 이틀 확보, 인력 투입]을 진행하고 있고, 다시 약속드릴 수 있는 날짜는 {date}입니다.',
              '작업 범위와 금액은 그대로입니다. 늘어난 시간은 제 일정에서 감당하겠습니다.',
              { if: 'date', text: '혹시 {date}가 어려우시면 말씀 주세요. 가능한 대안을 바로 정리해 드리겠습니다. 기다리시는 시간이 길어지지 않도록 중간 결과물을 먼저 보내드릴 수도 있습니다.', alt: '혹시 일정이 어려우시면 말씀 주세요. 가능한 대안을 바로 정리해 드리겠습니다. 중간 결과물을 먼저 보내드릴 수도 있습니다.' },
              '불편을 드려 죄송합니다. 기다려 주셔서 감사합니다.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          firm: {
            subject: ['{project} 납기 변경 안내', { if: 'date', text: '({date})' }],
            body: [
              '안녕하세요, {client}님.',
              '{project}의 납기를 기존 일정에서 {date}로 변경해 안내드립니다. 나중에 알게 되시는 일이 없도록 미리 말씀드립니다.',
              { if: 'days', text: '기존에 약속드린 날짜보다 {days}일 늦은 일정입니다.' },
              '지연 원인은 제 쪽에 있습니다. [한 줄]. 변명하지 않고 그대로 말씀드립니다.',
              '약속드린 범위는 그대로 진행되며 금액도 변동이 없습니다. 다만 오늘 이후 새로 요청하시는 작업은 납기에 영향을 주기 때문에, 시작 전에 먼저 확인드리겠습니다.',
              { if: 'date', text: '{date}가 어려우시면 [요일]까지 알려주세요. 그 경우 새 납기를 서면으로 확정하겠습니다. 어느 쪽이든 {date}까지는 결과물을 받으실 수 있습니다.', alt: '일정이 어려우시면 [요일]까지 알려주세요. 그 경우 새 납기를 서면으로 확정하겠습니다. 어느 쪽이든 새 납기까지는 결과물을 받으실 수 있습니다.' },
              { if: 'sender', text: '{sender}' }
            ]
          },
          short: {
            join: ' ',
            subject: ['{project} 납기 변경', { if: 'date', text: '— {date}' }],
            body: [
              '{client}님, {project} 납기가 {date}로 밀립니다. 제 쪽 문제이고, 범위와 금액은 그대로입니다.',
              { if: 'days', text: '약 {days}일 늦어집니다.' },
              '{date}까지 완성해서 드리거나, 그 전에 중간 결과물을 먼저 보내드리겠습니다. 날짜가 어려우시면 지금 알려주세요.',
              { if: 'sender', text: '{sender}' }
            ]
          }
        }
      }
    },

    /* ------------------------------------------------------------ 2 ------- */
    {
      id: 'invoice',
      svg: '<svg viewBox="0 0 24 24"><path d="M6.2 3.2h11.6v17.6l-2.9-1.9-2.9 1.9-2.9-1.9-2.9 1.9z"/><path d="M9.2 8.2h5.6M9.2 12h5.6"/></svg>',
      fields: ['client', 'project', 'amount', 'days', 'date'],
      label: {
        en: { name: 'Unpaid invoice', blurb: 'Delivered, not paid. Nudge without begging.', amount: 'Invoice amount', days: 'Days overdue', date: 'Invoice due date' },
        ko: { name: '미수금 독촉', blurb: '일은 끝났는데 입금이 없을 때. 비굴하지 않게.', amount: '청구 금액', days: '연체 일수', date: '납기(입금)일' }
      },
      avoid: {
        en: 'Never write “just following up on my email below”. It gives them homework, not a payment date. Ask for one specific thing: when the money goes out.',
        ko: '“아래 메일 다시 한번 확인 부탁드립니다”는 상대에게 숙제를 내는 문장입니다. 결제를 묻는 문장이 아닙니다. “입금 예정일” 하나만 물어보세요.'
      },
      tpl: {
        en: {
          calm: {
            subject: ['Quick check: invoice for {project}', { if: 'amount', text: '({amount})' }],
            body: [
              'Hi {client},',
              { if: 'date', text: 'A quick note on the invoice for {project}: it was due {date} and I have not seen it come through yet. It may well be sitting in an approval queue on your side, which is why I am asking rather than chasing.', alt: 'A quick note on the invoice for {project}: it was due recently and I have not seen it come through yet. It may well be sitting in an approval queue on your side, which is why I am asking rather than chasing.' },
              'Could you tell me where it stands? If it needs a PO number, a cost centre or a different billing contact, send me what is needed and I will resubmit it today.',
              { if: 'amount', text: 'The total is {amount}, and I have re-attached the invoice in case that is easier.' },
              'Thanks — nothing else changes, and everything else stays on schedule.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          firm: {
            subject: ['{project} invoice', { if: 'amount', text: '({amount})' }, { if: 'days', text: '— {days} days overdue' }],
            body: [
              'Hi {client},',
              { if: 'days', text: 'The invoice for {project} ({amount}) is now {days} days past its due date. I have raised it before, so I will be plain about what I need.', alt: 'The invoice for {project} ({amount}) is now past its due date. I have raised it before, so I will be plain about what I need.' },
              'Please confirm one of the following today: (1) the date the payment goes out, (2) who signs it off and when, or (3) what is missing on my side so I can fix it.',
              'If I have not heard back by [date + 3 working days], I will pause new work on {project} until the account is up to date. I would rather not, and it is much easier for both of us to settle this week than next month.',
              'Everything already delivered stays yours, of course.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          short: {
            join: ' ',
            subject: ['Overdue: {project} invoice', { if: 'amount', text: '({amount})' }],
            body: [
              'Hi {client} — the invoice for {project} is past due.',
              { if: 'days', text: 'It is {days} days late now.' },
              { if: 'amount', text: 'Amount: {amount}.' },
              'Can you tell me the payment date today? If a PO or a billing detail is stuck, tell me which one and I will resend it corrected.',
              { if: 'sender', text: '{sender}' }
            ]
          }
        },
        ko: {
          calm: {
            subject: ['{project} 인보이스 확인 부탁드립니다', { if: 'amount', text: '({amount})' }],
            body: [
              '안녕하세요, {client}님.',
              { if: 'date', text: '{project} 인보이스 관련해 가볍게 여쭙습니다. 납기일이 {date}였는데 아직 확인되지 않아, 결재 단계에 머물러 있는 건 아닌지 싶어 연락드렸습니다.', alt: '{project} 인보이스가 아직 확인되지 않아, 결재 단계에 머물러 있는 건 아닌지 싶어 연락드렸습니다.' },
              '현재 진행 상황만 알려주시면 됩니다. 발주번호나 결재 담당자가 따로 필요하시면 말씀 주시는 대로 오늘 다시 제출하겠습니다.',
              { if: 'amount', text: '금액은 {amount}이고, 인보이스를 다시 첨부드렸습니다.' },
              '번거롭게 해 죄송합니다. 다른 업무는 그대로 진행하고 있겠습니다.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          firm: {
            subject: ['{project} 인보이스', { if: 'amount', text: '({amount})' }, { if: 'days', text: '— {days}일 연체' }],
            body: [
              '안녕하세요, {client}님.',
              { if: 'days', text: '{project} 인보이스가 {days}일 연체된 상태입니다. 이미 한 번 말씀드린 건이라, 필요한 것만 분명하게 여쭙겠습니다.', alt: '{project} 인보이스가 연체된 상태입니다. 이미 한 번 말씀드린 건이라, 필요한 것만 분명하게 여쭙겠습니다.' },
              { if: 'amount', text: '금액은 {amount}입니다.' },
              '오늘까지 아래 중 하나를 확인받고 싶습니다. 1) 입금 예정일 2) 결재 담당자와 결재 시점 3) 제 쪽에서 보완해야 할 서류',
              '[3영업일 뒤]까지 회신이 없으면 {project} 관련 신규 요청은 미수금이 정리될 때까지 잠시 멈추겠습니다. 원하지 않는 방법이고, 다음 달보다 이번 주에 정리하시는 편이 서로 편합니다.',
              '이미 전달드린 결과물은 그대로 사용하실 수 있습니다.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          short: {
            join: ' ',
            subject: ['{project} 인보이스 연체', { if: 'amount', text: '({amount})' }],
            body: [
              '{client}님, {project} 인보이스가 연체 상태입니다.',
              { if: 'days', text: '연체된 지 {days}일 지났습니다.' },
              { if: 'amount', text: '금액은 {amount}입니다.' },
              '입금 예정일만 오늘 알려주세요. 발주번호나 결재 서류 때문에 막혀 있다면 어느 부분인지 말씀 주시는 대로 바로 다시 보내드리겠습니다.',
              { if: 'sender', text: '{sender}' }
            ]
          }
        }
      }
    },

    /* ------------------------------------------------------------ 3 ------- */
    {
      id: 'scope',
      svg: '<svg viewBox="0 0 24 24"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="4"/><path d="M12 8.2v7.6M8.2 12h7.6"/></svg>',
      fields: ['client', 'project', 'amount', 'days'],
      label: {
        en: { name: 'Scope creep', blurb: '“While you are in there…” just became extra work.', amount: 'Add-on fee', days: 'Extra days' },
        ko: { name: '범위 초과 요청', blurb: '“이것만 조금 더”가 결국 추가 작업이 될 때.', amount: '추가 비용', days: '추가 소요일' }
      },
      avoid: {
        en: 'Never absorb the “quick favour” first and price it later. Work you have already delivered cannot be invoiced without feeling like a trap — and they will read it exactly that way.',
        ko: '“이번만 그냥 해드릴게요”로 시작해서 나중에 청구하지 마세요. 이미 해버린 일에 청구서를 보내면 덫처럼 느껴집니다. 상대도 정확히 그렇게 받아들입니다.'
      },
      tpl: {
        en: {
          calm: {
            subject: ['{project} — one thing to agree before I add it'],
            body: [
              'Hi {client},',
              'Thanks for the extra detail on {project}. It is a good idea and I can see why you want it.',
              'One thing so we stay on the same page: what you have described is not inside the original scope, which covered [X, Y, Z]. It is roughly [N hours / one more design round] of work, so I would rather set it up as a small add-on than squeeze it into an estimate that does not include it.',
              { if: 'amount', text: 'The add-on would be {amount}.' },
              { if: 'days', text: 'It adds {days} days to the timeline.' },
              'Two easy options: (1) I add it now and send a one-page updated quote today, or (2) we park it until after delivery. Tell me which and I will start straight away — I just do not want to do the work and then hand you a surprise bill.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          firm: {
            subject: ['{project}: [item] sits outside the agreed scope'],
            body: [
              'Hi {client},',
              'On your request to add [item] to {project}: that sits outside the scope we agreed, which was [X, Y, Z]. Extra work is quoted separately — that is the only way I can keep the original price where it is.',
              { if: 'amount', text: 'The cost is {amount}.' },
              { if: 'days', text: 'It adds {days} working days on top of the current schedule.' },
              'If you want it included, reply “approved” and I will send a one-page change order to sign; I start as soon as it is signed. If not, we keep the current scope and finish on the agreed date.',
              'I am not saying no. I am saying it is a separate line on the invoice, agreed before I start rather than after.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          short: {
            join: ' ',
            subject: ['{project}: [item] is extra work'],
            body: [
              'Hi {client} — adding [item] falls outside the scope we agreed ([X, Y, Z]).',
              { if: 'amount', text: 'It is {amount} extra.' },
              { if: 'days', text: 'It adds {days} days.' },
              'Reply “approved” and I will send the change order today. Otherwise I finish the agreed work first.',
              { if: 'sender', text: '{sender}' }
            ]
          }
        },
        ko: {
          calm: {
            subject: ['{project} — 추가 전에 하나만 확인할게요'],
            body: [
              '안녕하세요, {client}님.',
              '{project} 관련해 추가로 말씀 주신 부분 잘 봤습니다. 방향이 좋아서 저도 하고 싶습니다.',
              '다만 처음 정한 범위([X, Y, Z])에는 들어가지 않는 내용입니다. 대략 [N시간 / 디자인 1회 분량] 정도라, 기존 견적에 끼워 넣기보다 작은 추가 작업으로 정리하는 게 서로 깔끔할 것 같습니다.',
              { if: 'amount', text: '추가 비용은 {amount}입니다.' },
              { if: 'days', text: '기간은 {days}일 늘어납니다.' },
              '두 가지 중 편하신 쪽으로 정하시면 됩니다. 1) 지금 추가하고 오늘 수정 견적을 보내드리기 2) 이번 납기 후로 미루기. 말씀 주시는 대로 바로 시작하겠습니다. 나중에 청구서로 놀라게 해드리고 싶지 않아 미리 여쭙습니다.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          firm: {
            subject: ['{project}: [추가 항목]은 계약 범위 밖입니다'],
            body: [
              '안녕하세요, {client}님.',
              '{project}에 요청하신 [추가 항목]은 처음 합의한 범위([X, Y, Z]) 밖의 업무입니다. 범위 외 작업은 별도 견적으로 진행합니다. 그래야 기존 금액을 그대로 유지할 수 있습니다.',
              { if: 'amount', text: '비용은 {amount}입니다.' },
              { if: 'days', text: '현재 일정에 {days}일이 추가됩니다.' },
              '진행을 원하시면 “승인”이라고 회신해 주세요. 서명용 변경 요청서 한 장을 보내드리고, 서명 후 착수하겠습니다. 원하지 않으시면 기존 범위대로 약속한 날짜에 마무리하겠습니다.',
              '거절이 아니라, 시작 전에 별도 항목으로 정하자는 말씀입니다.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          short: {
            join: ' ',
            subject: ['{project}: [추가 항목]은 별도입니다'],
            body: [
              '{client}님, [추가 항목]은 합의된 범위([X, Y, Z]) 밖입니다.',
              { if: 'amount', text: '추가 비용은 {amount}입니다.' },
              { if: 'days', text: '{days}일이 더 필요합니다.' },
              '진행하시려면 “승인”만 보내주세요. 변경 요청서를 바로 보내드리고 착수하겠습니다. 아니면 기존 작업 먼저 마무리하겠습니다.',
              { if: 'sender', text: '{sender}' }
            ]
          }
        }
      }
    },

    /* ------------------------------------------------------------ 4 ------- */
    {
      id: 'revisions',
      svg: '<svg viewBox="0 0 24 24"><circle cx="6.4" cy="6.4" r="2.5"/><circle cx="6.4" cy="17.6" r="2.5"/><path d="M8.5 7.9 20 18M8.5 16.1 20 6"/></svg>',
      fields: ['client', 'project', 'amount'],
      label: {
        en: { name: 'Free revisions & discounts', blurb: 'One more round, or a lower price. Both cost you.', amount: 'Extra fee' },
        ko: { name: '무상 수정·할인 거절', blurb: '수정 한 번 더, 금액은 조금 깎아 달라는 요청.', amount: '추가 비용' }
      },
      avoid: {
        en: 'Never say “I will just do it this once”. The money you lose is small; the precedent is permanent. One free “last” round becomes the number they expect every time.',
        ko: '“이번만 그냥 해드릴게요”는 손해보다 습관이 문제입니다. 한 번의 무료 수정이 다음 계약의 기준이 됩니다.'
      },
      tpl: {
        en: {
          calm: {
            subject: ['{project} — where we are on revisions'],
            body: [
              'Hi {client},',
              'Thank you for the honest feedback. I would much rather hear it than not.',
              'Here is where {project} stands: the package included [2] rounds of revisions and both have been delivered. What you are describing now reads to me as a new direction rather than a correction, which makes it a different piece of work rather than a fix.',
              'I am glad to do it. It is about [N] hours, and I can start [day].',
              { if: 'amount', text: 'The fee for the extra round would be {amount}.' },
              'If that is more than you want to spend right now, there is a cheaper path: we keep the current version and I do one focused pass on the single element you care about most — that one is on me. Tell me which element and I will have it back to you today.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          firm: {
            subject: ['{project}: additional revisions are billed'],
            body: [
              'Hi {client},',
              'On the revision request for {project}: the contract covers [2] rounds and both have been delivered. Additional rounds are billed at [rate] per round.',
              { if: 'amount', text: 'This one would be {amount}.' },
              'I am not able to fold it in as a free extra. The included rounds were already priced into the project fee, so a third free round means working at a loss.',
              'Two clean options: (1) I invoice the extra round and start [day], or (2) we close the project on the version you have now — it is finished, checked and ready to use.',
              'I am happy with either. I just need it in writing before I reopen the file.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          short: {
            join: ' ',
            subject: ['{project}: revision rounds are used up'],
            body: [
              'Hi {client} — both revision rounds included in {project} are used.',
              { if: 'amount', text: 'Extra rounds are [rate] each — {amount} for this one.' },
              'Say go and I start [day]. Otherwise we are done on the current version, which is ready to use as it is.',
              { if: 'sender', text: '{sender}' }
            ]
          }
        },
        ko: {
          calm: {
            subject: ['{project} 수정 관련해 정리해 말씀드립니다'],
            body: [
              '안녕하세요, {client}님.',
              '솔직한 피드백 감사합니다. 말씀해 주시지 않는 것보다 훨씬 낫습니다.',
              '{project} 기준으로 정리하면, 계약에 포함된 수정은 [2회]이고 두 번 모두 전달드렸습니다. 지금 말씀하신 부분은 기존 결과를 고치는 것보다 방향을 새로 잡는 작업에 가까워서, 별도 작업으로 보는 게 맞을 것 같습니다.',
              '진행은 기꺼이 하겠습니다. 대략 [N]시간이고 [요일]부터 시작할 수 있습니다.',
              { if: 'amount', text: '추가 수정 비용은 {amount}입니다.' },
              '지금 비용이 부담되시면 더 가벼운 방법도 있습니다. 현재 버전은 그대로 두고, 가장 신경 쓰이시는 한 가지만 제가 한 번 더 손보겠습니다. 이번 한 번은 제가 부담하겠습니다. 어느 부분인지 알려주시면 오늘 바로 보내드리겠습니다.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          firm: {
            subject: ['{project}: 추가 수정은 별도 청구입니다'],
            body: [
              '안녕하세요, {client}님.',
              '{project} 수정 요청 관련 안내드립니다. 계약에 포함된 수정은 [2회]이며 모두 전달되었습니다. 추가 수정은 회당 [금액]으로 청구됩니다.',
              { if: 'amount', text: '이번 건은 {amount}입니다.' },
              '무상으로 추가해 드리기는 어렵습니다. 포함된 두 번의 수정 비용은 이미 프로젝트 금액에 반영되어 있어, 세 번째를 무료로 하면 손실 작업이 됩니다.',
              '두 가지로 정리할 수 있습니다. 1) 추가 수정비를 청구하고 [요일]에 착수 2) 현재 버전으로 프로젝트를 마무리. 현재 버전은 검수까지 끝나 바로 사용하실 수 있습니다.',
              '어느 쪽이든 괜찮습니다. 다만 파일을 다시 열기 전에 서면으로 확정 부탁드립니다.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          short: {
            join: ' ',
            subject: ['{project} 수정 횟수 소진 안내'],
            body: [
              '{client}님, {project}에 포함된 수정 2회는 모두 사용하셨습니다.',
              { if: 'amount', text: '추가 수정은 회당 [금액], 이번 건은 {amount}입니다.' },
              '진행하시려면 말씀 주세요. 아니면 현재 버전으로 마무리하겠습니다. 지금 상태로도 바로 사용하실 수 있습니다.',
              { if: 'sender', text: '{sender}' }
            ]
          }
        }
      }
    },

    /* ------------------------------------------------------------ 5 ------- */
    {
      id: 'appointment',
      svg: '<svg viewBox="0 0 24 24"><rect x="3.4" y="5.2" width="17.2" height="15.4" rx="3.4"/><path d="M8.4 3v4.2M15.6 3v4.2M3.4 10.2h17.2"/></svg>',
      fields: ['client', 'project', 'date'],
      label: {
        en: { name: 'Reschedule & confirm', blurb: 'Move a visit, or lock the one you have.', date: 'Proposed date / time' },
        ko: { name: '일정 변경·확정', blurb: '방문을 옮겨야 하거나, 잡힌 일정을 확정할 때.', date: '제안할 새 날짜·시간' }
      },
      avoid: {
        en: 'Never send “sorry, can we reschedule?” with no slot in it. That hands the whole problem back to them, and it costs you the booking more often than you would think.',
        ko: '“죄송한데 일정을 다시 잡을 수 있을까요?”만 보내지 마세요. 문제를 통째로 상대에게 넘기는 문장이고, 생각보다 자주 예약이 취소됩니다.'
      },
      tpl: {
        en: {
          calm: {
            subject: ['Moving our appointment for {project}', { if: 'date', text: 'to {date}' }],
            body: [
              'Hi {client},',
              'Something has come up on my side and I need to move our appointment for {project}. I am sorry — I know your time is booked too, not just mine.',
              { if: 'date', text: 'Could we do {date} instead? Same time of day, same job, nothing else changes.', alt: 'Could we move it to a day later this week? Same time of day, same job, nothing else changes.' },
              'If that does not work, send me two windows that do and I will fit into one of them. I will keep [day] morning free for you either way.',
              'I will confirm the moment you reply, and send a reminder the day before so it does not sneak up on you.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          firm: {
            subject: ['Appointment change: {project}', { if: 'date', text: '→ {date}' }],
            body: [
              'Hi {client},',
              'I need to move our appointment for {project}. The new slot I can offer is {date}, with the same duration as booked.',
              'Please reply “confirmed” by [day] so I can hold it. If that slot does not work, give me two alternatives on [weekday] and I will take one of them.',
              'I do not move appointments unless I have to, and once you confirm this one it will not move again.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          short: {
            join: ' ',
            subject: ['{project}: can we move our appointment?'],
            body: [
              'Hi {client} — sorry, I need to move our appointment for {project}.',
              { if: 'date', text: 'Can we do {date} instead? Same time, same job.', alt: 'Can we find another slot this week? Same time, same job.' },
              'Reply yes and it is locked. If not, send me two times that work and I will take one.',
              { if: 'sender', text: '{sender}' }
            ]
          }
        },
        ko: {
          calm: {
            subject: ['{project} 방문 일정 변경 안내', { if: 'date', text: '({date})' }],
            body: [
              '안녕하세요, {client}님.',
              '제 쪽에 갑작스러운 일이 생겨 {project} 방문 일정을 옮겨야 할 것 같습니다. 고객님 시간도 예약되어 있는데 죄송합니다.',
              { if: 'date', text: '{date}로 옮겨도 될까요? 시간대와 진행 내용은 그대로이고, 달라지는 것은 없습니다.', alt: '이번 주 안에서 하루만 옮겨도 될까요? 시간대와 진행 내용은 그대로이고, 달라지는 것은 없습니다.' },
              '그 날이 어려우시면 가능한 시간 두 개만 알려주세요. 그중 하나로 맞추겠습니다. [요일] 오전은 비워두겠습니다.',
              '회신 주시는 대로 확정해 드리고, 하루 전에 다시 한 번 알려드리겠습니다.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          firm: {
            subject: ['{project} 방문 일정 변경 안내', { if: 'date', text: '→ {date}' }],
            body: [
              '안녕하세요, {client}님.',
              '{project} 방문 일정을 {date}로 변경해 안내드립니다. 소요 시간은 예약하신 것과 동일합니다.',
              '[요일]까지 “확정”이라고 회신해 주시면 해당 시간을 잡아두겠습니다. 그 시간이 어려우시면 [요일] 중 가능한 시간 두 개를 알려주세요. 그중 하나로 맞추겠습니다.',
              '부득이한 경우가 아니면 일정을 옮기지 않습니다. 이번 일정은 확정해 주시면 다시 변경하지 않겠습니다.',
              { if: 'sender', text: '{sender}' }
            ]
          },
          short: {
            join: ' ',
            subject: ['{project} 방문 일정 조정 부탁드립니다'],
            body: [
              '{client}님, 죄송합니다. {project} 방문 일정을 옮겨야 합니다.',
              { if: 'date', text: '{date}로 가능하실까요? 시간과 진행 내용은 동일합니다.', alt: '이번 주 안에서 다른 시간으로 가능하실까요? 진행 내용은 동일합니다.' },
              '가능하시면 “네”만 보내주세요. 어려우시면 가능한 시간 두 개를 알려주시면 맞추겠습니다.',
              { if: 'sender', text: '{sender}' }
            ]
          }
        }
      }
    }
  ];

  var EXAMPLES = {
    en: { client: 'Sarah Chen', project: 'the website redesign', amount: '1,200', days: '5', date: 'Fri 5 Dec', sender: 'Jordan' },
    ko: { client: '김민지', project: '브랜드 홈페이지', amount: '120만원', days: '5', date: '12월 5일 금요일', sender: '이준호' }
  };

  /* ------------------------------------------------- 3. Template engine ----- */

  function byId(id) {
    for (var i = 0; i < SCENARIOS.length; i++) {
      if (SCENARIOS[i].id === id) { return SCENARIOS[i]; }
    }
    return null;
  }

  function clean(v) {
    if (v === null || v === undefined) { return ''; }
    return String(v).replace(/\s+/g, ' ').trim();
  }

  function buildContext(s, lang) {
    return {
      client: clean(s.client), project: clean(s.project), amount: clean(s.amount),
      days: clean(s.days), date: clean(s.date), sender: clean(s.sender), lang: lang
    };
  }

  function fill(text, ctx, lang) {
    /* Words that keep a sentence grammatical when an optional field is empty.
       Amount and days are omitted from the sentence instead (the empty brackets
       are removed by tidy), but a date always needs something in its place, so
       it becomes a visible, editable slot the user can see and replace. */
    var d = (lang === 'ko')
      ? { client: '고객', project: '해당 작업', date: '[새 날짜]' }
      : { client: 'there', project: 'the project', date: '[new date]' };
    return String(text).replace(/\{(\w+)\}/g, function (whole, key) {
      var v = ctx[key];
      if (v === undefined || v === null || v === '') { return d[key] || ''; }
      return v;
    });
  }

  /* Turns cleaning artefacts that appear when optional fields are empty:
     double spaces, spaces before punctuation, empty brackets, blank lines. */
  function tidy(text) {
    var out = String(text);
    out = out.replace(/[ \t]{2,}/g, ' ');
    out = out.replace(/[ \t]+([,.;:!?])/g, '$1');
    out = out.replace(/\(\s*\)/g, '');
    out = out.replace(/\[\s*\]/g, '');
    out = out.replace(/[ \t]+\n/g, '\n');
    out = out.replace(/\n{3,}/g, '\n\n');
    out = out.replace(/^[ \t]+/gm, '');
    out = out.replace(/[ \t]{2,}/g, ' ');
    out = out.replace(/[ \t]+([,.;:!?])/g, '$1');
    return out.trim();
  }

  function renderSegments(segments, ctx, lang, joiner) {
    var parts = [];
    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      var text = null;
      if (typeof seg === 'string') {
        text = seg;
      } else if (seg && typeof seg === 'object') {
        if (ctx[seg.if]) { text = seg.text; }
        else if (seg.alt) { text = seg.alt; }
      }
      if (text === null || text === undefined) { continue; }
      var filled = fill(text, ctx, lang);
      if (filled.trim()) { parts.push(filled); }
    }
    return parts.join(joiner);
  }

  /* Public entry point. Never throws for missing fields: every field is
     optional and every template degrades to a sentence that still works. */
  function generate(state) {
    var s = state || {};
    var lang = (s.lang === 'ko') ? 'ko' : 'en';
    var scenario = byId(s.scenario) || SCENARIOS[0];
    var tone = (TONES.indexOf(s.tone) >= 0) ? s.tone : 'calm';
    var tpl = scenario.tpl[lang][tone];
    var ctx = buildContext(s, lang);
    var subject = tidy(renderSegments(tpl.subject, ctx, lang, ' '));

    /* A template can ask for inline paragraphs (the "short" tone reads better
       as one compact block than as six fragments). The signature always stays
       on its own line. */
    var bodySegs = tpl.body;
    var inline = tpl.join === ' ';
    if (inline) {
      bodySegs = bodySegs.filter(function (seg) {
        return !(seg && typeof seg === 'object' && seg.if === 'sender');
      });
    }
    var body = tidy(renderSegments(bodySegs, ctx, lang, tpl.join || '\n\n'));
    if (inline && ctx.sender) { body = body + '\n\n' + ctx.sender; }
    return {
      subject: subject,
      body: body,
      avoid: scenario.avoid[lang],
      scenario: scenario.id,
      tone: tone,
      lang: lang,
      charCount: body.length,
      wordCount: body ? body.split(/\s+/).length : 0
    };
  }

  /* ------------------------------------------------------- 4. DOM wiring --- */

  var state = { scenario: 'deadline', tone: 'calm', lang: 'en' };
  var fields = { client: '', project: '', amount: '', days: '', date: '', sender: '' };

  function el(id) { return document.getElementById(id); }

  function detectLang() {
    var saved = null;
    try { saved = window.localStorage.getItem('cr.lang'); } catch (e) { saved = null; }
    if (saved === 'ko' || saved === 'en') { return saved; }
    var nav = (navigator.language || 'en').toLowerCase();
    return nav.indexOf('ko') === 0 ? 'ko' : 'en';
  }

  function renderScenarios() {
    var wrap = el('scenarios');
    wrap.innerHTML = '';
    SCENARIOS.forEach(function (sc) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'scenario' + (sc.id === state.scenario ? ' is-active' : '');
      b.setAttribute('data-id', sc.id);
      b.setAttribute('aria-pressed', sc.id === state.scenario ? 'true' : 'false');
      b.innerHTML = '<span class="sc-icon" aria-hidden="true">' + sc.svg + '</span>' +
        '<span class="sc-text"><strong>' + sc.label[state.lang].name + '</strong>' +
        '<small>' + sc.label[state.lang].blurb + '</small></span>';
      b.addEventListener('click', function () {
        state.scenario = sc.id;
        renderScenarios();
        renderFields();
        update();
      });
      wrap.appendChild(b);
    });
  }

  function renderTones() {
    var wrap = el('tones');
    wrap.innerHTML = '';
    TONES.forEach(function (id) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tone' + (id === state.tone ? ' is-active' : '');
      b.setAttribute('data-tone', id);
      b.setAttribute('aria-pressed', id === state.tone ? 'true' : 'false');
      b.innerHTML = '<strong>' + UI[state.lang].toneNames[id] + '</strong>' +
        '<small>' + UI[state.lang].toneNotes[id] + '</small>';
      b.addEventListener('click', function () {
        state.tone = id;
        renderTones();
        update();
      });
      wrap.appendChild(b);
    });
  }

  function renderFields() {
    var sc = byId(state.scenario) || SCENARIOS[0];
    var wrap = el('fields');
    wrap.innerHTML = '';
    sc.fields.concat(['sender']).forEach(function (key) {
      var label = sc.label[state.lang][key] || UI[state.lang].fieldLabels[key];
      var box = document.createElement('label');
      box.className = 'field';
      box.setAttribute('for', 'f-' + key);
      box.innerHTML = '<span class="field-label">' + label + '</span>' +
        '<input id="f-' + key + '" data-field="' + key + '" type="text" autocomplete="off" ' +
        'placeholder="' + UI[state.lang].placeholders[key] + '">';
      var input = box.querySelector('input');
      input.value = fields[key] || '';
      input.addEventListener('input', function (e) {
        fields[key] = e.target.value;
        update();
      });
      wrap.appendChild(box);
    });
  }

  function update() {
    var out = generate({
      scenario: state.scenario, tone: state.tone, lang: state.lang,
      client: fields.client, project: fields.project, amount: fields.amount,
      days: fields.days, date: fields.date, sender: fields.sender
    });
    el('subject').textContent = out.subject;
    el('body').textContent = out.body;
    el('avoid').textContent = out.avoid;
    el('stats').textContent = state.lang === 'ko'
      ? out.charCount + UI.ko.chars + ' · ' + out.wordCount + UI.ko.words
      : out.charCount + ' ' + UI.en.chars + ' · ' + out.wordCount + ' ' + UI.en.words;
    var mail = el('mailto');
    if (mail) {
      mail.setAttribute('href', 'mailto:?subject=' + encodeURIComponent(out.subject) +
        '&body=' + encodeURIComponent(out.body));
    }
    document.body.setAttribute('data-scenario', state.scenario);
  }

  function applyLang(next) {
    state.lang = next;
    document.documentElement.setAttribute('lang', next);
    document.title = UI[next].docTitle;
    try { window.localStorage.setItem('cr.lang', next); } catch (e) {}
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (node) {
      var key = node.getAttribute('data-i18n');
      if (UI[next][key] !== undefined) { node.textContent = UI[next][key]; }
    });
    Array.prototype.forEach.call(document.querySelectorAll('.lang-btn'), function (b) {
      var on = b.getAttribute('data-lang') === next;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    renderScenarios();
    renderTones();
    renderFields();
    update();
  }

  function copyText(text, button, okLabel) {
    var flash = function () {
      if (!button.getAttribute('data-label')) { button.setAttribute('data-label', button.textContent); }
      button.classList.add('is-done');
      button.textContent = okLabel;
      toast(okLabel + ' ✓');
      window.setTimeout(function () {
        button.classList.remove('is-done');
        button.textContent = button.getAttribute('data-label');
      }, 1600);
    };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', 'readonly');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) { flash(); } else { toast(UI[state.lang].copyFail); }
    };
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(flash, fallback);
    } else {
      fallback();
    }
  }

  var toastTimer = null;
  function toast(msg) {
    var node = el('toast');
    node.textContent = msg;
    node.classList.add('is-on');
    if (toastTimer) { window.clearTimeout(toastTimer); }
    toastTimer = window.setTimeout(function () { node.classList.remove('is-on'); }, 1800);
  }

  function init() {
    state.lang = detectLang();
    Array.prototype.forEach.call(document.querySelectorAll('.lang-btn'), function (b) {
      b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
    });
    el('copy-subject').addEventListener('click', function () {
      copyText(el('subject').textContent, this, UI[state.lang].copied);
    });
    el('copy-body').addEventListener('click', function () {
      copyText(el('body').textContent, this, UI[state.lang].copied);
    });
    el('example').addEventListener('click', function () {
      var ex = EXAMPLES[state.lang];
      Object.keys(ex).forEach(function (k) { fields[k] = ex[k]; });
      renderFields();
      update();
      toast(UI[state.lang].exampleLoaded);
    });
    el('clear').addEventListener('click', function () {
      Object.keys(fields).forEach(function (k) { fields[k] = ''; });
      renderFields();
      update();
    });
    applyLang(state.lang);
  }

  var api = {
    generate: generate,
    scenarios: SCENARIOS,
    tones: TONES,
    ui: UI,
    examples: EXAMPLES,
    tidy: tidy,
    _state: state,
    _fields: fields
  };

  if (typeof document !== 'undefined' && document.getElementById) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  return api;
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = CR; }
