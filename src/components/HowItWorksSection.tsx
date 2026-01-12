import { motion } from 'framer-motion';

const blocks = [
  {
    title: '147 puntos que cuentan tu historia',
    text: 'Mapeamos tu rostro y sonrisa en 147 puntos de referencia. No para juzgarte. Para entenderte.',
  },
  {
    title: 'La conexión que nadie ve',
    text: 'Descubrimos cómo tu sonrisa transforma tu rostro. Y cómo tu rostro potencia tu sonrisa. Una sinergia única, solo tuya.',
  },
  {
    title: '24 preguntas. Cero suposiciones.',
    text: 'Tu historia, tus preferencias, tu contexto. Porque la armonía no es una fórmula. Es personal.',
  },
  {
    title: 'Tu rostro de antes, tu potencial de hoy',
    text: 'Con una foto tuya de hace 5-10 años, nuestra IA detecta tu evolución natural y proyecta mejoras que respetan quién eres.',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="relative z-10 px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-medium text-primary uppercase tracking-[0.2em] mb-3 block">
            Cómo Funciona
          </span>
          <h2 
            className="text-3xl md:text-4xl lg:text-5xl text-white leading-tight"
            style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500 }}
          >
            Un análisis que te{' '}
            <span className="italic bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
              entiende
            </span>
          </h2>
        </motion.div>

        {/* Blocks Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {blocks.map((block, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative rounded-2xl bg-white/[0.03] border border-white/[0.08] p-8 hover:bg-white/[0.05] hover:border-primary/20 transition-all duration-300"
            >
              <div className="absolute top-6 right-6 text-5xl font-bold text-white/[0.03] select-none">
                0{index + 1}
              </div>
              <h3 
                className="text-xl md:text-2xl text-white mb-4 leading-snug"
                style={{ fontFamily: '"Playfair Display", serif', fontWeight: 500 }}
              >
                {block.title}
              </h3>
              <p className="text-white/60 leading-relaxed">
                {block.text}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
