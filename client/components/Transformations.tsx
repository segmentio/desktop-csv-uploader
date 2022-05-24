import React, {useState} from 'react';
import { Pane, Text, SelectMenu, Button, Heading, majorScale,
  TextInput } from 'evergreen-ui';
import {v4 as uuidv4} from 'uuid';

import {StatefulRow} from './StatefulRow'
import {Transformation} from '../types'


interface TransformationsProps{
  columnNames:Array<string>,
  transformationList:Array<Transformation>|never
  setTransformationList:React.Dispatch<React.SetStateAction<Array<Transformation>|never>>}
export function Transformations(props:TransformationsProps){

  function handleAdd(item:Transformation){
    const newList = props.transformationList.concat(item);
    props.setTransformationList(newList)
  }

  function handleRemoval(id:string){
    const newList = props.transformationList.filter((transformation) => transformation.id !== id)
    props.setTransformationList(newList)
  }

  return(
      <Pane marginY={majorScale(2)}>
        <Heading> Transformations </Heading>
        {props.transformationList.map((transformation, index)=>(
          <TransformationDisplay
          index={index}
          transformation={transformation}
          handleRemoval={handleRemoval}
          />
        ))}
        <Pane marginY={majorScale(2)}>
          <AddTransformation transformationList={props.transformationList} columns={props.columnNames} handleAdd={handleAdd}/>
        </Pane>
      </Pane>
  )
}

export type TransformationDisplayProps = {index:number} & {transformation:Transformation} & {handleRemoval:(id:string)=>void}
function TransformationDisplay(props:TransformationDisplayProps){
  return (
    <StatefulRow key={props.transformation.id} index={props.index}>
      <Pane marginY={majorScale(3)} marginX={majorScale(1)} display='inline-flex'>
        <Button marginRight={majorScale(1)}>
        {props.transformation.type}
        </Button>

        <Button marginRight={majorScale(1)}>
        {props.transformation.target}
        </Button>
        <Text marginRight={majorScale(1)} marginTop={majorScale(1)}>
          for
        </Text>
        <Button marginRight={majorScale(1)}>
        {props.transformation.conditional}
        </Button>
        <Button
          marginLeft={majorScale(1)}
          intent='danger'
          onClick={() => props.handleRemoval(props.transformation.id)}>
          delete
        </Button>
      </Pane>
    </StatefulRow>
  )
}

export interface AddTransformationProps{
  columns:Array<string>,
  handleAdd:(transformation:Transformation)=>void,
  transformationList:Array<Transformation>|never,
}
function AddTransformation(props:AddTransformationProps){
  const [addTransformation, setAddTransformation] = useState(false)
  const [transformationType, setTransformationType] = useState('')
  const [transformationTarget, setTransformationTarget] = useState('')
  const [transformationConditional, setTransformationConditional] = useState('')
  const [selected, setSelected] = useState('')

  if (addTransformation==true) {
    return(
      <Pane
      marginY={majorScale(2)}
      display="inline-flex"
      >
        <SelectMenu
          title="Transformation Type"
          options={['Ignore Column', 'Default Event Name', 'Randomize'].map((label) => ({ label, value: label }))}
          selected={transformationType}
          hasFilter={false}
          hasTitle={false}
          onSelect={(item) => {
            if (typeof item.value === 'string'){
              setTransformationType(item.value)
              setSelected(item.value)
            }
          }}>
          <Button>{selected || 'Select Transformation Type'}</Button>
        </SelectMenu>

        <TransformationTarget
         columns={props.columns}
         transformationType={transformationType}
         setTransformationTarget={setTransformationTarget}
         />
        <TransformationConditional
         transformationType={transformationType}
         setTransformationConditional={setTransformationConditional}/>
        <Button
          marginLeft={majorScale(2)}
          intent='danger'
          onClick={()=>{
            setTransformationType('')
            setTransformationTarget('')
            setTransformationConditional('')
            setAddTransformation(false)
          }}>
          delete
        </Button>
        <Button
          marginLeft={majorScale(1)}
          intent='success'
          onClick={()=>{
            if (transformationType && transformationTarget && transformationConditional){
                props.handleAdd({
                  type:transformationType,
                  target:transformationTarget,
                  conditional:transformationConditional,
                  id: uuidv4()
                })
            }
            setTransformationType('')
            setTransformationTarget('')
            setTransformationConditional('')
            setAddTransformation(false)
          }}>
          save
        </Button>
      </Pane>
    )
  } else {
    return (
      <Button
    onClick={()=>setAddTransformation(true)}>
    Add Transformation
      </Button>
  )}
}

export interface TransformationTarget{
  transformationType:string
  columns:Array<string>,
  setTransformationTarget:(value:string)=>void}
function TransformationTarget(props:TransformationTarget) {
  const [selected, setSelected] = React.useState('')

  if (!props.transformationType){
    return null
  } else if (props.transformationType == 'Ignore Column') {
      return(
        <Pane marginX={majorScale(1)}>

          <SelectMenu
            options={props.columns.map((label) => ({ label, value: label }))}
            selected={selected}
            hasFilter={false}
            hasTitle={false}
            onSelect={(item) => {
              if (typeof item.value == 'string'){
                setSelected(item.value)
                props.setTransformationTarget(item.value)
              }}}>
            <Button>{selected || 'Select Column...'}</Button>
          </SelectMenu>
        </Pane>
      )
  } else if (props.transformationType == 'Default Event Name') {
      return(
        <Pane marginX={majorScale(1)}>
          <TextInput
            onChange={(e:any) => {
                console.log('set selected call')
                setSelected(e.target.value)
                props.setTransformationTarget(e.target.value)
            }}>
          </TextInput>
        </Pane>
      )
  } else if (props.transformationType == 'Randomize'){
      props.setTransformationTarget('anonymousId')
      return(
        <Pane marginX={majorScale(1)}>
        {()=>{
          setSelected('anonymousId')
          props.setTransformationTarget('anonymousId')
        }}
          <Button>
          anonymousId
          </Button>
        </Pane>
      )
  } else return null
}

export interface TransformationConditional{
  transformationType:string
  setTransformationConditional:(value:string)=>void}
function TransformationConditional(props:TransformationConditional) {
  const [selected, setSelected] = React.useState('')

  let options:Array<string> = ['All Events','Track Events', 'Identify Events']
  if (props.transformationType == 'Default Event Name') {
    options = ['Track Events']
  }

  if (!props.transformationType){
    return null
  } else if (props.transformationType) {
    return(
      <Pane
      marginX={majorScale(2)}
      display="inline-flex">
        <Text marginTop={majorScale(1)} marginRight={majorScale(1)} >
        for
        </Text>
        <SelectMenu
          options={options.map((label) => ({ label, value: label }))}
          selected={selected}
          hasFilter={false}
          hasTitle={false}
          onSelect={(item) => {
            if (typeof item.value == 'string'){
              setSelected(item.value)
              props.setTransformationConditional(item.value)
            }
          }}>
          <Button>{selected || 'Select Conditional...'}</Button>
        </SelectMenu>
      </Pane>
    )
  } else return null
}
