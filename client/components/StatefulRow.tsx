import{useState} from 'react';
import {Table} from 'evergreen-ui';

interface StatefulRowProps{
  index:number,
  key:string,
  isSelectable?:boolean,
  setRowSelection?:React.Dispatch<React.SetStateAction<number>>,
  setRowIsSelected?:React.Dispatch<React.SetStateAction<boolean>>,
  children:React.ReactNode
}
export function StatefulRow(props:StatefulRowProps) {
  const [rowNumber, _] = useState(props.index)
  return(
    <Table.Row
    key={props.key}
    isSelectable={props.isSelectable? props.isSelectable: false}
    flexGrow={1}
    onSelect={() => {
      if (props.setRowSelection && props.setRowIsSelected){
        props.setRowSelection(rowNumber)
        props.setRowIsSelected(true)
      }
    }}>
      {props.children}
    </Table.Row>
  )
}
