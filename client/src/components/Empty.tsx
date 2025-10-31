import empty from '../assets/Images/empty.png'

interface EmptyProps {
  text?: string;
  width?: string;
  height?: string;
  showText?: boolean;
}

export default function Empty({ text = 'No data found', width = '100%', height = '100%', showText = false }: EmptyProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fff',
      }}
    >
      {showText === true ? (
        <h4> {text} </h4>
      ) : (
        <img
          src={empty}
          alt='images'
          style={{
            width: width,
            height: height,
          }}
        />
      )}
    </div>
  )
}
