'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RotateCcw, Share2, Grid3x3 } from 'lucide-react'
import Header from '@/components/layout/Header'
import { useAuth } from '@/context/AuthContext'

interface FortuneResult {
  luckIndex: number
  title: string
  description: string[]
  luckyItem: {
    name: string
    emoji: string
    description: string
  }
}

// 운세 결과 데이터 - 카테고리별로 분류 (각 카테고리당 15개)
const fortuneResultsByCategory: {
  high: FortuneResult[]
  medium: FortuneResult[]
  low: FortuneResult[]
  very_low: FortuneResult[]
} = {
  high: [
    {
      luckIndex: 95,
      title: "¡Un día extraordinariamente afortunado!",
      description: [
        "Hoy es tu día perfecto. Todo lo que toques se convertirá en oro.",
        "Las oportunidades más increíbles aparecerán en tu camino.",
        "Tu energía positiva es imparable y atraerá todo lo mejor."
      ],
      luckyItem: {
        name: "Estrella dorada",
        emoji: "⭐",
        description: "Simboliza tu brillante futuro que está por llegar."
      }
    },
    {
      luckIndex: 92,
      title: "¡Día de grandes logros!",
      description: [
        "Hoy conseguirás todo lo que te propongas.",
        "Las personas importantes notarán tu talento y esfuerzo.",
        "Es el momento ideal para perseguir tus sueños más grandes."
      ],
      luckyItem: {
        name: "Medalla de victoria",
        emoji: "🏆",
        description: "Representa todos los triunfos que están por venir."
      }
    },
    {
      luckIndex: 90,
      title: "¡Energía positiva desbordante!",
      description: [
        "Tu actitud positiva cambiará todo a tu alrededor.",
        "Los obstáculos se convertirán en oportunidades.",
        "Hoy sentirás que puedes lograr cualquier cosa."
      ],
      luckyItem: {
        name: "Rayo de luz",
        emoji: "⚡",
        description: "Ilumina tu camino hacia el éxito."
      }
    },
    {
      luckIndex: 88,
      title: "¡Día de sorpresas maravillosas!",
      description: [
        "Recibirás noticias inesperadas que te llenarán de alegría.",
        "Alguien especial aparecerá en tu vida hoy.",
        "Las casualidades trabajarán a tu favor."
      ],
      luckyItem: {
        name: "Cofre del tesoro",
        emoji: "💎",
        description: "Guarda todas las bendiciones que recibirás."
      }
    },
    {
      luckIndex: 87,
      title: "¡Momento de transformación positiva!",
      description: [
        "Hoy marcará un antes y un después en tu vida.",
        "Las decisiones que tomes tendrán consecuencias muy positivas.",
        "Tu intuición te guiará hacia el camino correcto."
      ],
      luckyItem: {
        name: "Mariposa dorada",
        emoji: "🦋",
        description: "Simboliza tu transformación hacia algo mejor."
      }
    },
    {
      luckIndex: 85,
      title: "¡Un día muy afortunado!",
      description: [
        "Todo saldrá mejor de lo que esperas hoy.",
        "Es el momento perfecto para tomar decisiones importantes.",
        "Tu energía positiva atraerá buenas oportunidades."
      ],
      luckyItem: {
        name: "Collar de oro",
        emoji: "👑",
        description: "Te traerá prosperidad y buena fortuna."
      }
    },
    {
      luckIndex: 83,
      title: "¡Día de conexiones especiales!",
      description: [
        "Conocerás personas que cambiarán tu perspectiva.",
        "Las relaciones importantes se fortalecerán hoy.",
        "Tu carisma atraerá a las personas correctas."
      ],
      luckyItem: {
        name: "Anillo de la amistad",
        emoji: "💍",
        description: "Fortalece los lazos con quienes te rodean."
      }
    },
    {
      luckIndex: 82,
      title: "¡Día de creatividad desbordante!",
      description: [
        "Tus ideas más brillantes surgirán hoy.",
        "Es el momento perfecto para proyectos creativos.",
        "Tu inspiración alcanzará niveles extraordinarios."
      ],
      luckyItem: {
        name: "Pincel mágico",
        emoji: "🎨",
        description: "Transforma tus ideas en realidad."
      }
    },
    {
      luckIndex: 80,
      title: "¡Día de abundancia!",
      description: [
        "La prosperidad llegará de formas inesperadas.",
        "Tus esfuerzos serán recompensados generosamente.",
        "Hoy sentirás que el universo conspira a tu favor."
      ],
      luckyItem: {
        name: "Moneda de la suerte",
        emoji: "🪙",
        description: "Atrae riqueza y abundancia a tu vida."
      }
    },
    {
      luckIndex: 78,
      title: "¡Día de nuevos comienzos!",
      description: [
        "Una nueva etapa positiva comenzará hoy.",
        "Deja atrás lo que ya no te sirve.",
        "El futuro te depara grandes cosas."
      ],
      luckyItem: {
        name: "Semilla de la esperanza",
        emoji: "🌱",
        description: "Planta hoy lo que cosecharás mañana."
      }
    },
    {
      luckIndex: 77,
      title: "¡Día de reconocimiento!",
      description: [
        "Tu trabajo y esfuerzo serán reconocidos.",
        "Las personas valorarán tu dedicación.",
        "Hoy brillarás en todo lo que hagas."
      ],
      luckyItem: {
        name: "Estrella brillante",
        emoji: "✨",
        description: "Ilumina tu camino hacia el reconocimiento."
      }
    },
    {
      luckIndex: 75,
      title: "¡Día de aventuras emocionantes!",
      description: [
        "Vivirás experiencias que recordarás para siempre.",
        "La aventura te espera en cada esquina.",
        "Hoy será un día lleno de emociones positivas."
      ],
      luckyItem: {
        name: "Brújula de la aventura",
        emoji: "🧭",
        description: "Te guiará hacia experiencias inolvidables."
      }
    },
    {
      luckIndex: 73,
      title: "¡Día de sabiduría!",
      description: [
        "Aprenderás lecciones valiosas hoy.",
        "Tu intuición estará especialmente aguda.",
        "Las respuestas que buscas llegarán a ti."
      ],
      luckyItem: {
        name: "Libro de la sabiduría",
        emoji: "📖",
        description: "Contiene todas las respuestas que necesitas."
      }
    },
    {
      luckIndex: 72,
      title: "¡Día de armonía perfecta!",
      description: [
        "Todo en tu vida estará en perfecto equilibrio.",
        "Sentirás una paz interior profunda.",
        "La armonía reinará en todos los aspectos."
      ],
      luckyItem: {
        name: "Yin yang",
        emoji: "☯️",
        description: "Mantiene el equilibrio en tu vida."
      }
    },
    {
      luckIndex: 70,
      title: "¡Día de manifestación!",
      description: [
        "Tus deseos más profundos comenzarán a materializarse.",
        "El poder de tus pensamientos positivos se hará realidad.",
        "Hoy verás cómo tus intenciones se convierten en hechos."
      ],
      luckyItem: {
        name: "Lámpara mágica",
        emoji: "🪔",
        description: "Concede tus deseos más sinceros."
      }
    }
  ],
  medium: [
    {
      luckIndex: 68,
      title: "Un día de oportunidades",
      description: [
        "Las oportunidades estarán disponibles si las buscas.",
        "Mantén los ojos abiertos a nuevas posibilidades.",
        "Tu actitud determinará qué tan bien te irá hoy."
      ],
      luckyItem: {
        name: "Llave de las oportunidades",
        emoji: "🗝️",
        description: "Abre las puertas que estaban cerradas."
      }
    },
    {
      luckIndex: 65,
      title: "Un día equilibrado",
      description: [
        "Las cosas irán bien si mantienes la calma.",
        "Es buen momento para planificar el futuro.",
        "Confía en tu intuición para tomar decisiones."
      ],
      luckyItem: {
        name: "Cristal azul",
        emoji: "💎",
        description: "Te ayudará a mantener la serenidad."
      }
    },
    {
      luckIndex: 63,
      title: "Un día de crecimiento",
      description: [
        "Aprenderás cosas importantes sobre ti mismo.",
        "Es momento de reflexionar y crecer.",
        "Los pequeños cambios traerán grandes resultados."
      ],
      luckyItem: {
        name: "Espejo de la reflexión",
        emoji: "🪞",
        description: "Te muestra quién eres realmente."
      }
    },
    {
      luckIndex: 62,
      title: "Un día de estabilidad",
      description: [
        "Todo seguirá su curso normal y tranquilo.",
        "No habrá grandes sorpresas, pero tampoco problemas.",
        "Aprovecha para organizar tus asuntos pendientes."
      ],
      luckyItem: {
        name: "Ancla de estabilidad",
        emoji: "⚓",
        description: "Mantiene tu vida en equilibrio."
      }
    },
    {
      luckIndex: 60,
      title: "Un día de preparación",
      description: [
        "Es momento de prepararte para lo que viene.",
        "Las bases que pongas hoy serán importantes mañana.",
        "Invierte tiempo en lo que realmente importa."
      ],
      luckyItem: {
        name: "Cimientos sólidos",
        emoji: "🏗️",
        description: "Construye tu futuro paso a paso."
      }
    },
    {
      luckIndex: 58,
      title: "Un día de conexión",
      description: [
        "Las relaciones interpersonales serán importantes hoy.",
        "Escucha a los demás y aprende de ellos.",
        "La comunicación abierta traerá buenos resultados."
      ],
      luckyItem: {
        name: "Teléfono de la conexión",
        emoji: "📞",
        description: "Fortalece tus relaciones importantes."
      }
    },
    {
      luckIndex: 57,
      title: "Un día de paciencia activa",
      description: [
        "Las cosas tomarán su tiempo, pero llegarán.",
        "No te apresures, todo llegará en el momento correcto.",
        "La paciencia será tu mejor aliada hoy."
      ],
      luckyItem: {
        name: "Reloj de arena",
        emoji: "⏳",
        description: "Recuerda que todo tiene su momento."
      }
    },
    {
      luckIndex: 55,
      title: "Un día de pequeños triunfos",
      description: [
        "Celebra las pequeñas victorias de hoy.",
        "Cada paso cuenta, no importa cuán pequeño sea.",
        "Tu progreso constante te llevará lejos."
      ],
      luckyItem: {
        name: "Trofeo pequeño",
        emoji: "🏅",
        description: "Reconoce cada logro, por pequeño que sea."
      }
    },
    {
      luckIndex: 53,
      title: "Un día de aprendizaje",
      description: [
        "Aprenderás algo nuevo que te será útil.",
        "Mantén la mente abierta a nuevas ideas.",
        "El conocimiento que adquieras hoy será valioso."
      ],
      luckyItem: {
        name: "Lupa del conocimiento",
        emoji: "🔍",
        description: "Te ayuda a ver lo que otros no ven."
      }
    },
    {
      luckIndex: 52,
      title: "Un día de introspección",
      description: [
        "Es buen momento para conocerte mejor.",
        "Reflexiona sobre tus metas y valores.",
        "La autoconciencia te traerá claridad."
      ],
      luckyItem: {
        name: "Candil de la introspección",
        emoji: "🕯️",
        description: "Ilumina los rincones de tu mente."
      }
    },
    {
      luckIndex: 50,
      title: "Un día de balance",
      description: [
        "Encuentra el equilibrio entre trabajo y descanso.",
        "No te exijas demasiado, pero tampoco te quedes quieto.",
        "El balance es la clave del bienestar."
      ],
      luckyItem: {
        name: "Balanza del equilibrio",
        emoji: "⚖️",
        description: "Mantiene todo en perfecto balance."
      }
    },
    {
      luckIndex: 48,
      title: "Un día de adaptación",
      description: [
        "Serás flexible y te adaptarás a los cambios.",
        "La adaptabilidad será tu fortaleza hoy.",
        "Acepta los cambios con una actitud positiva."
      ],
      luckyItem: {
        name: "Camaleón de la adaptación",
        emoji: "🦎",
        description: "Te ayuda a adaptarte a cualquier situación."
      }
    },
    {
      luckIndex: 47,
      title: "Un día de organización",
      description: [
        "Es momento de poner orden en tu vida.",
        "Organiza tus pensamientos y tus acciones.",
        "La organización traerá claridad y paz."
      ],
      luckyItem: {
        name: "Carpeta organizadora",
        emoji: "📁",
        description: "Mantiene todo en su lugar correcto."
      }
    },
    {
      luckIndex: 45,
      title: "Un día de reflexión",
      description: [
        "Es un buen momento para descansar y pensar.",
        "No te preocupes por las cosas que no puedes controlar.",
        "Disfruta de las pequeñas cosas de la vida."
      ],
      luckyItem: {
        name: "Libro de sabiduría",
        emoji: "📚",
        description: "Te guiará hacia la claridad mental."
      }
    },
    {
      luckIndex: 43,
      title: "Un día de transición",
      description: [
        "Estás en un período de transición importante.",
        "Los cambios que vienen serán para mejor.",
        "Confía en el proceso y en ti mismo."
      ],
      luckyItem: {
        name: "Puente de transición",
        emoji: "🌉",
        description: "Te ayuda a cruzar hacia algo mejor."
      }
    }
  ],
  low: [
    {
      luckIndex: 42,
      title: "Un día de cautela",
      description: [
        "Es momento de ser más cuidadoso en tus decisiones.",
        "Piensa bien antes de actuar.",
        "La precaución te protegerá de problemas."
      ],
      luckyItem: {
        name: "Escudo protector",
        emoji: "🛡️",
        description: "Te protege de las dificultades."
      }
    },
    {
      luckIndex: 40,
      title: "Un día de descanso necesario",
      description: [
        "Tu cuerpo y mente necesitan descansar.",
        "No te fuerces demasiado hoy.",
        "El descanso es tan importante como la acción."
      ],
      luckyItem: {
        name: "Almohada del descanso",
        emoji: "🛏️",
        description: "Te ayuda a recuperar tu energía."
      }
    },
    {
      luckIndex: 38,
      title: "Un día de introspección profunda",
      description: [
        "Es momento de revisar tus prioridades.",
        "Reflexiona sobre lo que realmente importa.",
        "La introspección te traerá respuestas importantes."
      ],
      luckyItem: {
        name: "Espejo del alma",
        emoji: "🪞",
        description: "Te muestra tu verdadero yo."
      }
    },
    {
      luckIndex: 37,
      title: "Un día de paciencia",
      description: [
        "Las cosas pueden ser más lentas de lo esperado.",
        "Mantén la paciencia y no te desanimes.",
        "Es momento de ser más cuidadoso en tus decisiones."
      ],
      luckyItem: {
        name: "Velas aromáticas",
        emoji: "🕯️",
        description: "Te ayudarán a relajarte y encontrar paz."
      }
    },
    {
      luckIndex: 35,
      title: "Un día de aprendizaje de errores",
      description: [
        "Los errores de hoy serán lecciones valiosas.",
        "Aprende de cada experiencia, incluso las difíciles.",
        "Cada caída te enseña a levantarte más fuerte."
      ],
      luckyItem: {
        name: "Brújula de la experiencia",
        emoji: "🧭",
        description: "Te guía basándose en lo aprendido."
      }
    },
    {
      luckIndex: 33,
      title: "Un día de resistencia",
      description: [
        "Necesitarás ser fuerte y resistente hoy.",
        "Las dificultades te harán más fuerte.",
        "No te rindas, la perseverancia es clave."
      ],
      luckyItem: {
        name: "Roca de la resistencia",
        emoji: "🪨",
        description: "Simboliza tu fortaleza interior."
      }
    },
    {
      luckIndex: 32,
      title: "Un día de cuidado personal",
      description: [
        "Prioriza tu bienestar físico y mental.",
        "Cuídate a ti mismo antes que a otros.",
        "El autocuidado no es egoísmo, es necesidad."
      ],
      luckyItem: {
        name: "Bálsamo curativo",
        emoji: "💊",
        description: "Cura tu cuerpo y tu alma."
      }
    },
    {
      luckIndex: 30,
      title: "Un día de renovación",
      description: [
        "Es momento de dejar ir lo que ya no sirve.",
        "Haz espacio para cosas nuevas y mejores.",
        "La renovación traerá nuevas oportunidades."
      ],
      luckyItem: {
        name: "Fénix renacido",
        emoji: "🔥",
        description: "Simboliza tu capacidad de renacer."
      }
    },
    {
      luckIndex: 28,
      title: "Un día de humildad",
      description: [
        "La humildad te abrirá puertas importantes.",
        "Aprende a pedir ayuda cuando la necesites.",
        "Reconocer tus limitaciones es una fortaleza."
      ],
      luckyItem: {
        name: "Flor de loto",
        emoji: "🪷",
        description: "Simboliza la humildad y la pureza."
      }
    },
    {
      luckIndex: 27,
      title: "Un día de espera",
      description: [
        "A veces esperar es la mejor acción.",
        "No fuerces las cosas que aún no están listas.",
        "La paciencia activa traerá mejores resultados."
      ],
      luckyItem: {
        name: "Semilla en reposo",
        emoji: "🌰",
        description: "Espera el momento perfecto para crecer."
      }
    },
    {
      luckIndex: 25,
      title: "Un día de paciencia",
      description: [
        "Las cosas pueden ser más lentas de lo esperado.",
        "Mantén la paciencia y no te desanimes.",
        "Es momento de ser más cuidadoso en tus decisiones."
      ],
      luckyItem: {
        name: "Velas aromáticas",
        emoji: "🕯️",
        description: "Te ayudarán a relajarte y encontrar paz."
      }
    },
    {
      luckIndex: 23,
      title: "Un día de aceptación",
      description: [
        "Acepta las cosas que no puedes cambiar.",
        "Enfócate en lo que sí está en tus manos.",
        "La aceptación trae paz interior."
      ],
      luckyItem: {
        name: "Hoja al viento",
        emoji: "🍃",
        description: "Aprende a fluir con la vida."
      }
    },
    {
      luckIndex: 22,
      title: "Un día de silencio",
      description: [
        "El silencio te traerá las respuestas que buscas.",
        "A veces no hacer nada es hacer mucho.",
        "Escucha tu voz interior en el silencio."
      ],
      luckyItem: {
        name: "Campana de silencio",
        emoji: "🔕",
        description: "Te ayuda a encontrar la paz interior."
      }
    },
    {
      luckIndex: 20,
      title: "Un día de preparación silenciosa",
      description: [
        "Preparate en silencio para lo que viene.",
        "Los grandes cambios comienzan en pequeño.",
        "Tu preparación de hoy será tu éxito de mañana."
      ],
      luckyItem: {
        name: "Crisálida",
        emoji: "🦋",
        description: "Te prepara para tu transformación."
      }
    },
    {
      luckIndex: 18,
      title: "Un día de reflexión profunda",
      description: [
        "Necesitas tiempo para pensar y reflexionar.",
        "Las respuestas vendrán cuando estés listo.",
        "No tengas prisa, todo tiene su momento."
      ],
      luckyItem: {
        name: "Cristal de reflexión",
        emoji: "🔮",
        description: "Te muestra lo que necesitas ver."
      }
    }
  ],
  very_low: [
    {
      luckIndex: 17,
      title: "Un día de introspección necesaria",
      description: [
        "Es momento de mirar hacia adentro.",
        "Las respuestas están dentro de ti.",
        "La introspección te traerá claridad."
      ],
      luckyItem: {
        name: "Espejo interior",
        emoji: "🪞",
        description: "Refleja tu verdadero ser."
      }
    },
    {
      luckIndex: 15,
      title: "Un día de descanso obligatorio",
      description: [
        "Tu cuerpo y mente piden descanso.",
        "No puedes seguir sin recargar energías.",
        "El descanso es inversión, no pérdida de tiempo."
      ],
      luckyItem: {
        name: "Cama de descanso",
        emoji: "🛌",
        description: "Restaura tu energía vital."
      }
    },
    {
      luckIndex: 13,
      title: "Un día de soledad productiva",
      description: [
        "La soledad de hoy será tu mejor compañera.",
        "Aprovecha para conocerte mejor.",
        "A veces estar solo es necesario para crecer."
      ],
      luckyItem: {
        name: "Candil solitario",
        emoji: "🕯️",
        description: "Ilumina tu camino en la soledad."
      }
    },
    {
      luckIndex: 12,
      title: "Un día de aceptación total",
      description: [
        "Acepta que no todo está en tus manos.",
        "Deja ir el control y confía en el proceso.",
        "La aceptación es el primer paso hacia la paz."
      ],
      luckyItem: {
        name: "Hoja que se deja llevar",
        emoji: "🍂",
        description: "Aprende a fluir sin resistencia."
      }
    },
    {
      luckIndex: 10,
      title: "Un día de silencio absoluto",
      description: [
        "El silencio es tu mejor maestro hoy.",
        "No necesitas hacer nada, solo estar.",
        "En el silencio encontrarás todas las respuestas."
      ],
      luckyItem: {
        name: "Campana del silencio",
        emoji: "🔇",
        description: "Te conecta con tu esencia."
      }
    },
    {
      luckIndex: 8,
      title: "Un día de espera paciente",
      description: [
        "Espera sin ansiedad, todo llegará.",
        "La impaciencia solo trae sufrimiento.",
        "Confía en que el tiempo traerá lo necesario."
      ],
      luckyItem: {
        name: "Reloj de la paciencia",
        emoji: "⏰",
        description: "Te recuerda que todo tiene su tiempo."
      }
    },
    {
      luckIndex: 7,
      title: "Un día de humildad profunda",
      description: [
        "Reconoce tus limitaciones sin vergüenza.",
        "Pedir ayuda es signo de sabiduría.",
        "La humildad abre puertas que el orgullo cierra."
      ],
      luckyItem: {
        name: "Rosa humilde",
        emoji: "🌹",
        description: "Bella en su sencillez."
      }
    },
    {
      luckIndex: 5,
      title: "Un día de renovación interior",
      description: [
        "Es momento de limpiar tu interior.",
        "Deja ir todo lo que ya no te sirve.",
        "Haz espacio para lo nuevo que viene."
      ],
      luckyItem: {
        name: "Agua purificadora",
        emoji: "💧",
        description: "Limpia y renueva tu espíritu."
      }
    },
    {
      luckIndex: 4,
      title: "Un día de conexión con lo esencial",
      description: [
        "Vuelve a lo básico, a lo esencial.",
        "Las cosas simples son las más importantes.",
        "Encuentra paz en la simplicidad."
      ],
      luckyItem: {
        name: "Piedra simple",
        emoji: "🪨",
        description: "En su simplicidad está su fuerza."
      }
    },
    {
      luckIndex: 3,
      title: "Un día de contemplación",
      description: [
        "Observa sin juzgar, contempla sin actuar.",
        "A veces observar es más valioso que hacer.",
        "La contemplación te traerá entendimiento."
      ],
      luckyItem: {
        name: "Ojo contemplativo",
        emoji: "👁️",
        description: "Ve más allá de lo aparente."
      }
    },
    {
      luckIndex: 2,
      title: "Un día de quietud",
      description: [
        "La quietud es tu mejor acción hoy.",
        "No necesitas hacer nada especial.",
        "En la quietud encontrarás la paz."
      ],
      luckyItem: {
        name: "Lago tranquilo",
        emoji: "🌊",
        description: "Refleja la calma en tu interior."
      }
    },
    {
      luckIndex: 1,
      title: "Un día de vacío fértil",
      description: [
        "El vacío no es ausencia, es posibilidad.",
        "Deja que el vacío se llene naturalmente.",
        "A veces el vacío es necesario para crecer."
      ],
      luckyItem: {
        name: "Vaso vacío",
        emoji: "🥛",
        description: "Listo para llenarse de nuevas experiencias."
      }
    },
    {
      luckIndex: 0,
      title: "Un día de pausa total",
      description: [
        "Hoy es día de pausa, no de acción.",
        "Permítete simplemente ser, sin hacer.",
        "La pausa es tan importante como la acción."
      ],
      luckyItem: {
        name: "Pausa musical",
        emoji: "🎵",
        description: "El silencio entre las notas crea la música."
      }
    },
    {
      luckIndex: 0,
      title: "Un día de renacimiento",
      description: [
        "Todo final es un nuevo comienzo.",
        "Lo que termina hoy dará paso a algo mejor.",
        "Confía en el ciclo natural de la vida."
      ],
      luckyItem: {
        name: "Semilla nueva",
        emoji: "🌱",
        description: "Contiene todo el potencial del futuro."
      }
    },
    {
      luckIndex: 0,
      title: "Un día de transformación silenciosa",
      description: [
        "Los cambios más importantes son silenciosos.",
        "Estás transformándote sin darte cuenta.",
        "Confía en el proceso interno que está ocurriendo."
      ],
      luckyItem: {
        name: "Crisálida transformadora",
        emoji: "🦋",
        description: "Se transforma en silencio para volar después."
      }
    }
  ]
}

// 시드 기반 랜덤 함수 (같은 시드 = 같은 결과)
const seedRandom = (seed: string): number => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash) / 2147483647 // 0~1 사이 값
}

export default function FortuneResultPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<FortuneResult | null>(null)

  useEffect(() => {
    // 답변 데이터 가져오기
    const answers = JSON.parse(localStorage.getItem('fortune_answers') || '{}')
    
    // 답변을 기반으로 운세 결과 계산
    const calculateFortune = () => {
      const answerCount = Object.keys(answers).length
      if (answerCount === 0) {
        // 답변이 없으면 기본 결과 반환
        return fortuneResultsByCategory.medium[0]
      }
      
      // 1. 기본 점수 계산
      const positiveAnswers = Object.values(answers).filter((answer: string) => 
        answer.includes('positive') || 
        answer.includes('energetic') || 
        answer.includes('exciting') ||
        answer.includes('proactive') ||
        answer.includes('extrovert') ||
        answer.includes('romantic') ||
        answer.includes('colorful')
      ).length
      
      const baseScore = (positiveAnswers / answerCount) * 100
      
      // 2. 가중치 랜덤 추가 (-10 ~ +10) - 시드 기반으로 일일 고정
      const today = new Date().toISOString().split('T')[0] // "2025-11-14"
      const userId = user?.id || 'anonymous'
      const weightSeed = `${userId}_${today}_weight`
      const weightRandom = seedRandom(weightSeed)
      const randomWeight = Math.floor(weightRandom * 21) - 10 // -10 ~ +10
      const finalScore = Math.max(0, Math.min(100, baseScore + randomWeight))
      
      // 3. 카테고리 결정
      let category: 'high' | 'medium' | 'low' | 'very_low'
      if (finalScore >= 70) {
        category = 'high'
      } else if (finalScore >= 50) {
        category = 'medium'
      } else if (finalScore >= 30) {
        category = 'low'
      } else {
        category = 'very_low'
      }
      
      // 4. 일일 고정 결과 선택 (사용자별, 카테고리별)
      const resultSeed = `${userId}_${today}_${category}` // 사용자별, 날짜별, 카테고리별 고정
      
      const categoryResults = fortuneResultsByCategory[category]
      const randomValue = seedRandom(resultSeed)
      const resultIndex = Math.floor(randomValue * categoryResults.length)
      const selectedResult = categoryResults[resultIndex]
      
      console.log('[FORTUNE] 계산 결과:', {
        answerCount,
        positiveAnswers,
        baseScore: baseScore.toFixed(2),
        randomWeight,
        finalScore: finalScore.toFixed(2),
        category,
        resultSeed,
        resultIndex,
        selectedResult: selectedResult.title
      })
      
      return selectedResult
    }

    setTimeout(() => {
      const fortuneResult = calculateFortune()
      setResult(fortuneResult)
      setLoading(false)
    }, 2000)
  }, [user])

  const handleBack = () => {
    router.push('/community/tests')
  }

  const handleViewOtherTests = () => {
    router.push('/community/tests')
  }

  const handleRetake = () => {
    localStorage.removeItem('fortune_answers')
    router.push('/quiz/fortune/start')
  }

  const handleShare = async () => {
    try {
      // 프로덕션 URL 사용
      const isLocalhost = window.location.hostname === 'localhost'
      const baseUrl = isLocalhost 
        ? 'https://helloamiko.com'
        : window.location.origin
      
      const shareUrl = `${baseUrl}/quiz/fortune`
      const shareText = `Mi índice de fortuna es ${result?.luckIndex}% - ${result?.title}\n\n¡Descubre tu fortuna también!\n${shareUrl}`
      
      if (navigator.share) {
        await navigator.share({
          title: 'Mi Resultado de Fortuna',
          text: shareText
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        alert('¡Texto copiado!')
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return
      }
      
      try {
        const isLocalhost = window.location.hostname === 'localhost'
        const baseUrl = isLocalhost ? 'https://helloamiko.com' : window.location.origin
        const shareUrl = `${baseUrl}/quiz/fortune`
        const shareText = `Mi índice de fortuna es ${result?.luckIndex}% - ${result?.title}\n\n¡Descubre tu fortuna también!\n${shareUrl}`
        await navigator.clipboard.writeText(shareText)
        alert('¡Texto copiado!')
      } catch (clipboardError) {
        console.error('Error al compartir:', clipboardError)
        alert('Error al compartir.')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF4E6] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Analizando tu fortuna...
          </p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-[#FDF4E6] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            Error al cargar el resultado
          </p>
          <Button onClick={handleBack} variant="outline">
            Volver
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDF4E6]">
      <Header />
      
      <div className="pt-32 pb-8 px-4">
        <div className="max-w-md mx-auto">
          {/* 뒤로가기 버튼 */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          {/* 행운지수 섹션 */}
          <div className="bg-white border-2 border-black rounded-lg p-6 mb-4 text-center">
            <h2 className="text-3xl font-bold text-black mb-2">
              Índice de Fortuna {result.luckIndex}
            </h2>
            <div className="flex justify-center items-center gap-2 mt-4">
              <span className="text-2xl">🥠</span>
              <span className="text-2xl">☁️</span>
              <span className="text-2xl">☀️</span>
            </div>
          </div>

          {/* 설명 섹션 */}
          <div className="bg-gray-100 border-2 border-black rounded-lg p-6 mb-4">
            <h3 className="text-xl font-bold text-black mb-4 text-center">
              {result.title}
            </h3>
            <div className="space-y-2">
              {result.description.map((desc, index) => (
                <p key={index} className="text-black text-sm">
                  • {desc}
                </p>
              ))}
            </div>
          </div>

          {/* 행운아이템 섹션 */}
          <div className="bg-white border-2 border-black rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-black mb-4 text-center">
              Artículo de la Suerte
            </h3>
            <div className="text-center">
              <div className="text-6xl mb-3">{result.luckyItem.emoji}</div>
              <p className="text-black font-semibold mb-2">{result.luckyItem.name}</p>
              <p className="text-black text-sm">{result.luckyItem.description}</p>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button
                onClick={handleRetake}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Repetir Test
              </Button>
              <Button
                onClick={handleShare}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
            </div>
            <Button
              onClick={handleViewOtherTests}
              variant="outline"
              className="w-full border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50"
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              Ver Otros Tests
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
