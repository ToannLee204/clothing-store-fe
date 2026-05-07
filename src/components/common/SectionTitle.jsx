/**
 * Component tiêu đề section dùng chung cho các trang user-facing.
 */
export default function SectionTitle({ kicker, title, description, align = 'left' }) {
  return (
    <div className={align === 'center' ? 'mx-auto text-center max-w-3xl' : 'max-w-3xl'}>
      {kicker ? (
        <span className="mb-4 block text-[0.72rem] font-bold uppercase tracking-[0.22rem] text-[#0066A2]">
          {kicker}
        </span>
      ) : null}
      <h2 className="font-headline text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 text-base leading-7 text-slate-500 md:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}
