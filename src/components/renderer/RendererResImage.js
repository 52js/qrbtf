import React, {useEffect, useMemo, useState} from "react";
import {gamma} from "../../utils/imageUtils";
import {ParamTypes} from "../../constant/ParamTypes";
import {getTypeTable, QRPointType} from "../../utils/qrcodeHandler";
import {defaultResImage} from "../../constant/References";

function listPoints({ qrcode, params, icon }) {
    if (!qrcode) return []
console.log(icon)
    const nCount = qrcode.getModuleCount();
    const typeTable = getTypeTable(qrcode);
    const pointList = new Array(nCount);
    let alignType = params[3];
    let timingType = params[4];
    let posColor = params[6];

    let id = 0;
    for (let x = 0; x < nCount; x++) {
        for (let y = 0; y < nCount; y++) {
            const posX = 3 * x, posY = 3 * y;
            if (typeTable[x][y] === QRPointType.ALIGN_CENTER || typeTable[x][y] === QRPointType.ALIGN_OTHER) {
                if (qrcode.isDark(x, y)) {
                    if (alignType === 2) {
                        pointList.push(<use key={id++} xlinkHref="#B-black" x={posX - 0.03} y={posY - 0.03}/>)
                    } else {
                        pointList.push(<use key={id++} xlinkHref="#S-black" x={posX + 1 - 0.01} y={posY + 1 - 0.01}/>)
                    }
                } else {
                    if (alignType === 0) {
                        pointList.push(<use key={id++} xlinkHref="#S-white" x={posX + 1} y={posY + 1}/>)
                    } else {
                        pointList.push(<use key={id++} xlinkHref="#B-white" x={posX - 0.03} y={posY - 0.03}/>)
                    }
                }
            } else if (typeTable[x][y] === QRPointType.TIMING) {
                if (qrcode.isDark(x, y)) {
                    if (timingType === 2) {
                        pointList.push(<use key={id++} xlinkHref="#B-black" x={posX - 0.03} y={posY - 0.03}/>)
                    } else {
                        pointList.push(<use key={id++} xlinkHref="#S-black" x={posX + 1} y={posY + 1}/>)
                    }
                } else {
                    if (timingType === 0) {
                        pointList.push(<use key={id++} xlinkHref="#S-white" x={posX + 1} y={posY + 1}/>)
                    } else {
                        pointList.push(<use key={id++} xlinkHref="#B-white" x={posX - 0.03} y={posY - 0.03}/>)
                    }
                }
            } else if (typeTable[x][y] === QRPointType.POS_CENTER) {
                if (qrcode.isDark(x, y)) {
                    pointList.push(<use key={id++} fill={posColor} xlinkHref="#B" x={posX - 0.03} y={posY - 0.03}/>)
                }
            } else if (typeTable[x][y] === QRPointType.POS_OTHER) {
                if (qrcode.isDark(x, y)) {
                    pointList.push(<use key={id++} fill={posColor} xlinkHref="#B" x={posX - 0.03} y={posY - 0.03}/>)
                } else {
                    pointList.push(<use key={id++} xlinkHref="#B-white" x={posX - 0.03} y={posY - 0.03}/>)
                }
            } else {
                if (qrcode.isDark(x, y)) {
                    pointList.push(<use key={id++} xlinkHref="#S-black" x={posX + 1} y={posY + 1}/>)
                }
            }
        }
    }

    return pointList;
}

function getParamInfo() {
    return [
        {
            type: ParamTypes.UPLOAD_BUTTON,
            key: '背景图片',
            default: defaultResImage,
        },
        {
            type: ParamTypes.TEXT_EDITOR,
            key: '对比度',
            default: 0
        },
        {
            type: ParamTypes.TEXT_EDITOR,
            key: '曝光',
            default: 0
        },
        {
            type: ParamTypes.SELECTOR,
            key: '小定位点样式',
            default: 0,
            choices: [
                "无",
                "白",
                "黑白",
            ]
        },
        {
            type: ParamTypes.SELECTOR,
            key: '时钟样式',
            default: 0,
            choices: [
                "无",
                "白",
                "黑白",
            ]
        },
        {
            type: ParamTypes.COLOR_EDITOR,
            key: '信息点颜色',
            default: '#000000'
        },
        {
            type: ParamTypes.COLOR_EDITOR,
            key: '定位点颜色',
            default: '#000000'
        },
    ];
}

function getViewBox(qrcode) {
    if (!qrcode) return '0 0 0 0';

    const nCount = qrcode.getModuleCount() * 3;
    return String(-nCount / 5) + ' ' + String(-nCount / 5) + ' ' + String(nCount + nCount / 5 * 2) + ' ' + String(nCount + nCount / 5 * 2);
}

function getGrayPointList(params, size, black, white) {
    let canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    let img = document.createElement('img');
    let gpl = [];
    canvas.style.imageRendering = 'pixelated';
    size *= 3;

    img.src = params[0];
    let contrast = params[1]/100;
    let exposure = params[2]/100;
    return new Promise(resolve => {
        img.onload = () => {
            canvas.width = size;
            canvas.height = size;
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(img, 0, 0, size, size);

            for (let x = 0; x < canvas.width; x++) {
                for (let y = 0; y < canvas.height; y++) {
                    let imageData = ctx.getImageData(x, y, 1, 1);
                    let data = imageData.data;
                    let gray = gamma(data[0], data[1], data[2]);
                    if (Math.random() > ((gray / 255) + exposure - 0.5) * (contrast + 1) + 0.5 && ( x % 3 !== 1 || y % 3 !== 1 ) ) gpl.push(<use key={"g_" + x + "_" + y} x={x} y={y} xlinkHref={black} />);
                }
            }
            resolve(gpl);
        }
    })
}

const RendererResImage = ({qrcode, params, setParamInfo, icon}) => {
    let otherColor = params[5];

    useEffect(() => {
        setParamInfo(getParamInfo());
    }, [setParamInfo]);

    const [gpl, setGPL] = useState([]);
    useMemo(() => {
        getGrayPointList(params, qrcode.getModuleCount(), "#S-black", "#S-white").then(res => setGPL(res));
    }, [setGPL, params[0], params[1], params[2], qrcode])

    return (
        <svg className="Qr-item-svg" width="100%" height="100%" viewBox={getViewBox(qrcode)} fill="white"
             xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
            <defs>
                <rect id="B-black" fill={otherColor} width={3.08} height={3.08}/>
                <rect id="B-white" fill="white" width={3.08} height={3.08}/>
                <rect id="S-black" fill={otherColor} width={1.02} height={1.02}/>
                <rect id="S-white" fill="white" width={1.02} height={1.02}/>
                <rect id="B" width={3.08} height={3.08}/>
                <rect id="S" width={1.02} height={1.02}/>
            </defs>
            {gpl.concat(listPoints({ qrcode, params, icon }))}
        </svg>
    )
}


export default RendererResImage


RendererResImage.detail = (
    <div>满满科技感的重采样二值化像素点阵，有点东西</div>
);
